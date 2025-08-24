import { useState, useEffect } from 'react'
import { useBeemi } from './BeemiProvider'
import './FinalCompetition.css'

export default function FinalCompetition({ topGifters, onCompetitionComplete }) {
  const { beemi, isConnected } = useBeemi()
  const [competitionState, setCompetitionState] = useState('waiting') // waiting, active, completed
  const [competitionTime, setCompetitionTime] = useState(60) // 60 seconds for final competition
  const [scores, setScores] = useState({})
  const [winner, setWinner] = useState(null)
  const [currentGame, setCurrentGame] = useState(null)
  const [viewerVotes, setViewerVotes] = useState({})
  const [foundItems, setFoundItems] = useState({})
  const [gameType, setGameType] = useState('') // 'item' or 'letter'
  const [currentGiftValues, setCurrentGiftValues] = useState({}) // Track current gift values after deductions

  // Game items and letters for scavenger hunt
  const scavengerItems = [
    { name: 'Red Cup', emoji: '🥤', description: 'Find a red cup or container' },
    { name: 'Flower', emoji: '🌸', description: 'Find any flower or plant' },
    { name: 'Flask', emoji: '🧪', description: 'Find a flask or bottle' },
    { name: 'Book', emoji: '📚', description: 'Find a book' },
    { name: 'Phone', emoji: '📱', description: 'Find a phone or mobile device' },
    { name: 'Keys', emoji: '🔑', description: 'Find keys' },
    { name: 'Pen', emoji: '✏️', description: 'Find a pen or pencil' },
    { name: 'Watch', emoji: '⌚', description: 'Find a watch or clock' },
    { name: 'Glasses', emoji: '👓', description: 'Find glasses or sunglasses' },
    { name: 'Hat', emoji: '🎩', description: 'Find a hat or cap' }
  ]

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

  // Initialize competition
  const startFinalCompetition = () => {
    setCompetitionState('active')
    setCompetitionTime(60)
    
    // Initialize scores for all participants
    const initialScores = {
      host: 0,
      ...topGifters.reduce((acc, gifter) => {
        acc[gifter.username] = 0
        return acc
      }, {})
    }
         setScores(initialScores)
     setViewerVotes({})
     setFoundItems({})
     
     // Initialize current gift values
     const initialGiftValues = {}
     topGifters.forEach(gifter => {
       initialGiftValues[gifter.username] = gifter.totalValue
     })
     setCurrentGiftValues(initialGiftValues)

    // Randomly choose game type and item/letter
    const randomGameType = Math.random() < 0.5 ? 'item' : 'letter'
    setGameType(randomGameType)

    if (randomGameType === 'item') {
      const randomItem = scavengerItems[Math.floor(Math.random() * scavengerItems.length)]
      setCurrentGame({
        type: 'item',
        target: randomItem.name,
        emoji: randomItem.emoji,
        description: randomItem.description
      })
    } else {
      const randomLetter = alphabet[Math.floor(Math.random() * alphabet.length)]
      setCurrentGame({
        type: 'letter',
        target: randomLetter,
        description: `Find an item that starts with the letter "${randomLetter}"`
      })
    }
  }

  // Handle viewer votes
  useEffect(() => {
    if (!isConnected || !beemi || competitionState !== 'active') return

    const handleVote = (event) => {
      console.log('🗳️ Vote event received:', event)
      
      let voteData = null
      
      if (event.data && event.data.vote) {
        voteData = {
          username: event.data.user?.username || event.data.user?.displayName || event.data.user,
          votedFor: event.data.vote.player,
          timestamp: Date.now()
        }
      } else if (event.vote) {
        voteData = {
          username: event.user?.username || event.user?.displayName || event.user,
          votedFor: event.vote.player,
          timestamp: Date.now()
        }
      }

      if (voteData) {
        setViewerVotes(prev => ({
          ...prev,
          [voteData.username]: {
            votedFor: voteData.votedFor,
            timestamp: voteData.timestamp
          }
        }))
      }
    }

    // Handle chat comments as votes
    const handleChatVote = (event) => {
      console.log('💬 Chat event received for voting:', event)
      
      let message = ''
      let username = ''
      
      // Extract message and username from different event formats
      if (event.data && event.data.message) {
        message = event.data.message.toLowerCase().trim()
        username = event.data.user?.username || event.data.user?.displayName || event.data.user
      } else if (event.message) {
        message = event.message.toLowerCase().trim()
        username = event.user?.username || event.user?.displayName || event.user
      } else if (event.text) {
        message = event.text.toLowerCase().trim()
        username = event.user?.username || event.user?.displayName || event.user
      }

      if (message && username) {
        // Check if the message contains a participant name
        const participants = ['host', ...topGifters.map(g => g.username.toLowerCase())]
        
        for (const participant of participants) {
          if (message.includes(participant)) {
            console.log(`🗳️ Vote detected from comment: ${username} voted for ${participant}`)
            
            // Use the original case for the participant name
            const originalParticipant = participant === 'host' ? 'host' : 
              topGifters.find(g => g.username.toLowerCase() === participant)?.username || participant
            
            setViewerVotes(prev => ({
              ...prev,
              [username]: {
                votedFor: originalParticipant,
                timestamp: Date.now()
              }
            }))
            break
          }
        }
      }
    }

    // Listen for vote events
    if (beemi.streams) {
      beemi.streams.onChat(handleChatVote) // Using chat for both comments and vote simulation
    }

    // Listen for simulated vote events
    const handleSimulatedVote = (event) => {
      handleVote(event.detail)
    }

    // Listen for simulated chat events
    const handleSimulatedChat = (event) => {
      handleChatVote(event.detail)
    }

    window.addEventListener('beemi-vote', handleSimulatedVote)
    window.addEventListener('beemi-chat', handleSimulatedChat)
    
    // Store the vote handler globally
    window.voteHandler = handleVote
    window.chatHandler = handleChatVote

    return () => {
      window.removeEventListener('beemi-vote', handleSimulatedVote)
      window.removeEventListener('beemi-chat', handleSimulatedChat)
      delete window.voteHandler
      delete window.chatHandler
    }
  }, [beemi, isConnected, competitionState, topGifters])

  // Handle item found events
  useEffect(() => {
    if (!isConnected || !beemi || competitionState !== 'active') return

    const handleItemFound = (event) => {
      console.log('🎯 Item found event received:', event)
      
      let foundData = null
      
      if (event.data && event.data.found) {
        foundData = {
          player: event.data.player,
          item: event.data.item,
          timestamp: Date.now()
        }
      } else if (event.found) {
        foundData = {
          player: event.player,
          item: event.item,
          timestamp: Date.now()
        }
      }

             if (foundData) {
         setFoundItems(prev => ({
           ...prev,
           [foundData.player]: {
             item: foundData.item,
             timestamp: foundData.timestamp
           }
         }))

         // Award points for finding the item
         setScores(prev => ({
           ...prev,
           [foundData.player]: (prev[foundData.player] || 0) + 50
         }))
         
         
       }
    }

    // Listen for item found events
    if (beemi.multiplayer) {
      beemi.multiplayer.on('item-found', handleItemFound)
    }

    // Listen for simulated item found events
    const handleSimulatedItemFound = (event) => {
      handleItemFound(event.detail)
    }

    window.addEventListener('beemi-item-found', handleSimulatedItemFound)
    
    // Store the item found handler globally
    window.itemFoundHandler = handleItemFound

    return () => {
      window.removeEventListener('beemi-item-found', handleSimulatedItemFound)
      delete window.itemFoundHandler
    }
  }, [beemi, isConnected, competitionState])

  // Timer countdown for final competition
  useEffect(() => {
    if (competitionState !== 'active' || competitionTime <= 0) return

    const timer = setInterval(() => {
      setCompetitionTime(prev => {
        if (prev <= 1) {
          setCompetitionState('completed')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [competitionState, competitionTime])

  // Determine winner when competition ends
  useEffect(() => {
    if (competitionState === 'completed') {
      const sortedPlayers = Object.entries(scores)
        .sort(([,a], [,b]) => b - a)
      
      if (sortedPlayers.length > 0) {
        setWinner(sortedPlayers[0])
      }
      
      if (onCompetitionComplete) {
        onCompetitionComplete({
          winner: sortedPlayers[0],
          finalScores: scores,
          viewerVotes,
          foundItems,
          gameType,
          currentGame
        })
      }
    }
  }, [competitionState, scores, viewerVotes, foundItems, gameType, currentGame, onCompetitionComplete])

  

  // Simulate item found for demo purposes
  const simulateItemFound = (player) => {
    if (competitionState === 'active') {
      // Generate a realistic item name based on the challenge
      let submittedItem = ''
      
      if (gameType === 'item') {
        // For item challenges, use the target item or a variation
        const variations = [
          currentGame.target,
          currentGame.target.toLowerCase(),
          currentGame.target.toUpperCase(),
          `My ${currentGame.target}`,
          `The ${currentGame.target}`,
          currentGame.target.replace(' ', '')
        ]
        submittedItem = variations[Math.floor(Math.random() * variations.length)]
      } else {
        // For letter challenges, generate a word starting with the target letter
        const letterWords = {
          'A': ['Apple', 'Airplane', 'Ant', 'Art', 'Animal'],
          'B': ['Book', 'Ball', 'Bottle', 'Box', 'Bird'],
          'C': ['Cup', 'Car', 'Cat', 'Chair', 'Clock'],
          'D': ['Dog', 'Door', 'Desk', 'Doll', 'Duck'],
          'E': ['Elephant', 'Egg', 'Ear', 'Eye', 'Earth'],
          'F': ['Flower', 'Fish', 'Fan', 'Flag', 'Food'],
          'G': ['Glass', 'Girl', 'Game', 'Gift', 'Garden'],
          'H': ['Hat', 'House', 'Hand', 'Heart', 'Hair'],
          'I': ['Ice', 'Iron', 'Ice cream', 'Insect', 'Image'],
          'J': ['Jacket', 'Jewelry', 'Juice', 'Jump', 'Joy'],
          'K': ['Key', 'Kitchen', 'King', 'Kite', 'Knife'],
          'L': ['Light', 'Lamp', 'Leaf', 'Lion', 'Love'],
          'M': ['Mirror', 'Mouse', 'Moon', 'Music', 'Money'],
          'N': ['Notebook', 'Necklace', 'Night', 'Nose', 'Number'],
          'O': ['Orange', 'Ocean', 'Office', 'Oil', 'Owl'],
          'P': ['Phone', 'Pen', 'Paper', 'Plant', 'Picture'],
          'Q': ['Queen', 'Question', 'Quilt', 'Quiet', 'Quick'],
          'R': ['Rose', 'Ring', 'Radio', 'Rain', 'Road'],
          'S': ['Shoe', 'Sun', 'Star', 'Spoon', 'Shirt'],
          'T': ['Table', 'Tree', 'Toy', 'Tea', 'Time'],
          'U': ['Umbrella', 'Uniform', 'Unicorn', 'Up', 'Use'],
          'V': ['Vase', 'Vehicle', 'Voice', 'View', 'Village'],
          'W': ['Watch', 'Water', 'Window', 'Wall', 'Wind'],
          'X': ['Xylophone', 'X-ray', 'Xbox', 'Xenon', 'Xerox'],
          'Y': ['Yellow', 'Year', 'Youth', 'Yard', 'Yoga'],
          'Z': ['Zebra', 'Zoo', 'Zero', 'Zipper', 'Zinc']
        }
        const words = letterWords[currentGame.target] || ['Item']
        submittedItem = words[Math.floor(Math.random() * words.length)]
      }
      
      const foundEvent = {
        data: {
          player: player,
          item: submittedItem,
          timestamp: Date.now()
        }
      }

      // Dispatch simulated event
      const customEvent = new CustomEvent('beemi-item-found', { detail: foundEvent })
      window.dispatchEvent(customEvent)
      
             if (window.itemFoundHandler) {
         window.itemFoundHandler(foundEvent)
       }
     }
   }

  // Simulate viewer vote for demo purposes
  const simulateVote = (votedFor) => {
    if (competitionState === 'active') {
      const voteEvent = {
        data: {
          user: {
            username: 'Viewer_' + Math.floor(Math.random() * 1000),
            displayName: 'Viewer_' + Math.floor(Math.random() * 1000)
          },
          vote: {
            player: votedFor
          },
          timestamp: Date.now()
        }
      }

      // Dispatch simulated event
      const customEvent = new CustomEvent('beemi-vote', { detail: voteEvent })
      window.dispatchEvent(customEvent)
      
      if (window.voteHandler) {
        window.voteHandler(voteEvent)
      }
    }
  }

  if (!topGifters || topGifters.length === 0) {
    return (
      <div className="final-competition">
        <div className="no-participants">
          <h3>🏆 Final Competition</h3>
          <p>No participants available for final competition</p>
        </div>
      </div>
    )
  }

  return (
    <div className="final-competition">
      <div className="competition-header">
        <h2>🏆 Final Competition</h2>
        <p className="competition-description">
        Only the Top 2 Gifters get in on the scavenger hunt!
        </p>
      </div>

      {competitionState === 'waiting' && (
        <div className="waiting-section">
          <div className="participants">
            <h3>👥 Participants</h3>
            <div className="participant-list">
                             <div className="participant host">
                 <div className="participant-avatar">👑</div>
                 <div className="participant-info">
                   <div className="participant-name">Host</div>
                   <div className="participant-role">Game Master</div>
                 </div>
               </div>
                             {topGifters.map((gifter, index) => (
                 <div key={gifter.username} className="participant gifter">
                   <div className="participant-avatar">🎁</div>
                   <div className="participant-info">
                     <div className="participant-name">{gifter.username}</div>
                     <div className="participant-role">Top Gifter #{index + 1}</div>
                                           <div className="participant-stats">
                        <span className="gift-total">💰 {currentGiftValues[gifter.username] || gifter.totalValue} coins</span>
                        <span className="gift-count">🎁 {gifter.giftCount} gifts</span>
                      </div>
                   </div>
                 </div>
               ))}
            </div>
          </div>
          <button className="start-final-button" onClick={startFinalCompetition}>
            🚀 Start Scavenger Hunt
          </button>
        </div>
      )}

      {competitionState === 'active' && (
        <div className="active-competition">
          <div className="competition-timer">
            <span className="timer-label">Scavenger Hunt:</span>
            <span className="timer-value">{competitionTime}s</span>
          </div>

          {currentGame && (
            <div className="game-challenge">
              <h3>🎯 Challenge</h3>
              <div className="challenge-display">
                {gameType === 'item' ? (
                  <div className="item-challenge">
                    <div className="challenge-emoji">{currentGame.emoji}</div>
                    <div className="challenge-text">
                      <div className="challenge-title">Find: {currentGame.target}</div>
                      <div className="challenge-description">{currentGame.description}</div>
                    </div>
                  </div>
                ) : (
                  <div className="letter-challenge">
                    <div className="challenge-emoji">🔤</div>
                    <div className="challenge-text">
                      <div className="challenge-title">Letter: {currentGame.target}</div>
                      <div className="challenge-description">{currentGame.description}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div className="live-scores">
            <h4>📊 Live Scores</h4>
            <div className="scoreboard">
              {Object.entries(scores)
                .sort(([,a], [,b]) => b - a)
                .map(([player, score], index) => (
                                     <div key={player} className={`score-item ${index === 0 ? 'leading' : ''}`}>
                     <div className="player-rank">#{index + 1}</div>
                     <div className="player-name">
                       {player}
                     </div>
                     <div className="player-score">{score} pts</div>
                                           {player !== 'host' && topGifters.find(g => g.username === player) && (
                        <div className="player-gift-stats">
                          <span className="gift-stat">💰 {currentGiftValues[player] || topGifters.find(g => g.username === player).totalValue}</span>
                          <span className="gift-stat">🎁 {topGifters.find(g => g.username === player).giftCount}</span>
                        </div>
                      )}
                                           <div className="player-status">
                        {foundItems[player] ? (
                          <div className="found-status-container">
                            <span className="found-status">✅ Found!</span>
                          </div>
                        ) : (
                          <button 
                            className="found-button"
                            onClick={() => simulateItemFound(player)}
                          >
                            Found Item
                          </button>
                        )}
                      </div>
                   </div>
                ))}
            </div>
          </div>

          <div className="viewer-voting">
            <h4>🗳️ Viewer Votes</h4>
            <div className="voting-section">
              <div className="vote-buttons">
                {Object.keys(scores).map(player => (
                  <button 
                    key={player}
                    className="vote-button"
                    onClick={() => simulateVote(player)}
                  >
                    Vote for {player}
                  </button>
                ))}
              </div>
              <div className="vote-results">
                {Object.keys(scores).map(player => {
                  const playerVotes = Object.values(viewerVotes).filter(vote => vote.votedFor === player).length
                  const totalVotes = Object.keys(viewerVotes).length
                  const percentage = totalVotes > 0 ? Math.round((playerVotes / totalVotes) * 100) : 0
                  
                  return (
                    <div key={player} className="vote-result">
                      <span className="vote-player">{player}</span>
                      <div className="vote-bar">
                        <div 
                          className="vote-fill" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                      <span className="vote-count">{playerVotes} votes ({percentage}%)</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          
          
        </div>
      )}

      {competitionState === 'completed' && (
        <div className="competition-results">
          <h3>🏆 Competition Complete!</h3>
          
          {winner && (
            <div className="winner-announcement">
              <div className="winner-crown">👑</div>
              <div className="winner-name">{winner[0]}</div>
              <div className="winner-score">{winner[1]} points</div>
              <div className="winner-message">Congratulations!</div>
            </div>
          )}

          {currentGame && (
            <div className="game-summary">
              <h4>🎯 Game Summary</h4>
              <div className="summary-content">
                <p><strong>Challenge:</strong> {currentGame.description}</p>
                <p><strong>Target:</strong> {currentGame.target}</p>
                <div className="found-items-summary">
                  <h5>Items Found:</h5>
                  {Object.entries(foundItems).map(([player, data]) => (
                    <div key={player} className="found-item">
                      <span className="found-player">{player}</span>
                      <span className="found-item-name">found: {data.item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <div className="final-standings">
            <h4>Final Standings</h4>
            <div className="standings-list">
              {Object.entries(scores)
                .sort(([,a], [,b]) => b - a)
                .map(([player, score], index) => (
                  <div key={player} className={`standing-item ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : ''}`}>
                    <div className="standing-rank">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                    </div>
                    <div className="standing-name">{player}</div>
                    <div className="standing-score">{score} pts</div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
