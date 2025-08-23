import { useState, useEffect } from 'react'
import './App.css'
import BeemiProvider from './components/BeemiProvider'
import CommentList from './components/CommentList'
import GiftCompetition from './components/GiftCompetition'
import FinalCompetition from './components/FinalCompetition'
import GiftSimulator from './components/GiftSimulator'
import VoteSimulator from './components/VoteSimulator'
import CommentSimulator from './components/CommentSimulator'

function App() {
  const [comments, setComments] = useState([])
  const [showGiftCompetition, setShowGiftCompetition] = useState(true)
  const [showFinalCompetition, setShowFinalCompetition] = useState(false)
  const [topGifters, setTopGifters] = useState([])
  const [competitionHistory, setCompetitionHistory] = useState([])

  const handleGiftCompetitionEnd = (winners) => {
    console.log('🎁 Gift competition ended:', winners)
    setTopGifters(winners)
    setShowGiftCompetition(false)
    setShowFinalCompetition(true)
    
    // Add to competition history
    setCompetitionHistory(prev => [...prev, {
      type: 'gift',
      winners,
      timestamp: new Date().toISOString()
    }])
  }

  const handleFinalCompetitionComplete = (results) => {
    console.log('🏆 Final competition completed:', results)
    setShowFinalCompetition(false)
    
    // Add to competition history
    setCompetitionHistory(prev => [...prev, {
      type: 'final',
      results,
      timestamp: new Date().toISOString()
    }])
  }

  const resetCompetition = () => {
    setShowGiftCompetition(true)
    setShowFinalCompetition(false)
    setTopGifters([])
  }

  return (
    <BeemiProvider>
      <div className="app">
        <div className="header">
          <h1>🎁 Scavenger Hunt - Gift Competition</h1>
          <p className="subtitle">Compete with gifts, win the ultimate challenge!</p>
        </div>
        
        <div className="content">
          {/* Gift Competition Phase */}
          {showGiftCompetition && (
            <GiftCompetition 
              isActive={showGiftCompetition}
              onCompetitionEnd={handleGiftCompetitionEnd}
            />
          )}

          {/* Final Competition Phase */}
          {showFinalCompetition && (
            <FinalCompetition 
              topGifters={topGifters}
              onCompetitionComplete={handleFinalCompetitionComplete}
            />
          )}

          {/* Competition History */}
          {competitionHistory.length > 0 && (
            <div className="competition-history">
              <h3>📜 Competition History</h3>
              <div className="history-list">
                {competitionHistory.map((event, index) => (
                  <div key={index} className="history-item">
                    <div className="history-icon">
                      {event.type === 'gift' ? '🎁' : '🏆'}
                    </div>
                    <div className="history-content">
                      <div className="history-title">
                        {event.type === 'gift' ? 'Gift Competition' : 'Final Competition'}
                      </div>
                      <div className="history-details">
                        {event.type === 'gift' ? (
                          <span>
                            Winners: {event.winners.map(w => w.username).join(', ')}
                          </span>
                        ) : (
                          <span>
                            Winner: {event.results.winner?.[0] || 'N/A'}
                          </span>
                        )}
                      </div>
                      <div className="history-time">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reset Button */}
          {!showGiftCompetition && !showFinalCompetition && (
            <div className="reset-section">
              <button className="reset-button" onClick={resetCompetition}>
                🔄 Start New Competition
              </button>
            </div>
          )}

          {/* Gift Simulator for Testing */}
          <GiftSimulator />

          {/* Vote Simulator for Testing */}
          <VoteSimulator 
            participants={showFinalCompetition ? ['host', ...topGifters.map(g => g.username)] : []}
            isActive={showFinalCompetition}
          />

          {/* Comment Simulator for Testing */}
          <CommentSimulator 
            participants={showFinalCompetition ? ['host', ...topGifters.map(g => g.username)] : []}
            isActive={showFinalCompetition}
          />

          {/* Chat Comments */}
          <CommentList comments={comments} setComments={setComments} />
        </div>
      </div>
    </BeemiProvider>
  )
}

export default App 