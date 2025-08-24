import { useState } from 'react'
import { useBeemi } from './BeemiProvider'
import './CommentSimulator.css'

export default function CommentSimulator({ participants, isActive }) {
  const { beemi, isConnected } = useBeemi()
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationInterval, setSimulationInterval] = useState(null)
  const [customComment, setCustomComment] = useState('')

  const exampleComments = [
    "Good luck everyone! 🍀",
    "This is so exciting! 🎉",
    "Who do you think will win? 🤔",
    "Go team! 💪",
    "Amazing competition! ⭐",
    "I'm rooting for you! 📣",
    "This is intense! 😱",
    "What a challenge! 🏆",
    "Keep going! 🚀",
    "You've got this! 💯",
    "So close! 😮",
    "Incredible effort! 👏",
    "The suspense is killing me! 😬",
    "What a race! 🏃‍♂️",
    "Edge of my seat! 🪑"
  ]

  const participantComments = {
    host: [
      "Welcome to the final challenge! 🎯",
      "The item is hidden somewhere in this area! 🔍",
      "Remember, first to find it wins! 🏆",
      "Good luck to all participants! 🍀",
      "The clock is ticking! ⏰"
    ],
    default: [
      "I think I see something! 👀",
      "Checking over here! 🔍",
      "This is harder than I thought! 😅",
      "Still searching! 🕵️‍♂️",
      "Almost there! 💪",
      "Where could it be? 🤔",
      "Getting closer! 🎯",
      "This is challenging! 😤"
    ]
  }

  const sendCommentEvent = (username, message) => {
    if (!beemi || !isConnected) return

    const commentEvent = {
      data: {
        user: {
          username: username,
          displayName: username
        },
        comment: {
          message: message
        },
        timestamp: new Date().toISOString()
      }
    }

    // Simulate the comment event
    const customEvent = new CustomEvent('beemi-comment', { detail: commentEvent })
    window.dispatchEvent(customEvent)
    
    if (window.commentHandler) {
      window.commentHandler(commentEvent)
    }

    console.log('💬 Simulated comment:', commentEvent)
  }

  const sendRandomComment = () => {
    const randomComment = exampleComments[Math.floor(Math.random() * exampleComments.length)]
    const randomUser = 'Viewer_' + Math.floor(Math.random() * 1000)
    sendCommentEvent(randomUser, randomComment)
  }

  const sendParticipantComment = (participant) => {
    const comments = participantComments[participant] || participantComments.default
    const randomComment = comments[Math.floor(Math.random() * comments.length)]
    sendCommentEvent(participant, randomComment)
  }

  const sendCustomComment = () => {
    if (!customComment.trim()) return
    
    const randomUser = 'Viewer_' + Math.floor(Math.random() * 1000)
    sendCommentEvent(randomUser, customComment)
    setCustomComment('')
  }

  const startCommentSimulation = () => {
    if (isSimulating) return

    setIsSimulating(true)
    const interval = setInterval(() => {
      sendRandomComment()
    }, 4000) // Send a comment every 4 seconds

    setSimulationInterval(interval)
  }

  const stopCommentSimulation = () => {
    if (simulationInterval) {
      clearInterval(simulationInterval)
      setSimulationInterval(null)
    }
    setIsSimulating(false)
  }

  if (!isConnected) {
    return (
      <div className="comment-simulator">
        <div className="simulator-header">
          <h3>💬 Comment Simulator</h3>
          <p>Waiting for Beemi connection...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="comment-simulator">
      <div className="simulator-header">
        <h3>💬 Comment Simulator</h3>
        <p>Test chat comments during the competition</p>
      </div>

      <div className="simulator-controls">
        <button 
          className={`simulate-button ${isSimulating ? 'stop' : 'start'}`}
          onClick={isSimulating ? stopCommentSimulation : startCommentSimulation}
        >
          {isSimulating ? '⏹️ Stop Comments' : '▶️ Start Comments'}
        </button>
        
        <button 
          className="random-comment-button"
          onClick={sendRandomComment}
          disabled={isSimulating}
        >
          💬 Send Random Comment
        </button>
      </div>

      {isSimulating && (
        <div className="simulation-status">
          <span className="status-indicator">🟢</span>
          <span>Simulating comments every 4 seconds...</span>
        </div>
      )}

      <div className="custom-comment">
        <h4>Send Custom Comment:</h4>
        <div className="comment-input-section">
          <input
            type="text"
            className="comment-input"
            placeholder="Type your comment here..."
            value={customComment}
            onChange={(e) => setCustomComment(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendCustomComment()}
            disabled={isSimulating}
          />
          <button 
            className="send-comment-button"
            onClick={sendCustomComment}
            disabled={isSimulating || !customComment.trim()}
          >
            Send
          </button>
        </div>
      </div>

      {participants && participants.length > 0 && (
        <div className="participant-comments">
          <h4>Participant Comments:</h4>
          <div className="comment-buttons">
            {participants.map((participant) => (
              <button 
                key={participant}
                className="participant-comment-button"
                onClick={() => sendParticipantComment(participant)}
                disabled={isSimulating}
              >
                {participant} comment
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="comment-info">
        <h4>Comment Instructions:</h4>
        <div className="info-content">
          <p>• Viewers can chat during the competition to show support</p>
          <p>• Participants can also send updates about their progress</p>
          <p>• Use the buttons above to simulate different types of comments</p>
          <p>• Or start automatic simulation to generate random viewer comments</p>
        </div>
      </div>

      <div className="example-comments">
        <h4>Example Comments:</h4>
        <div className="examples-list">
          {exampleComments.slice(0, 8).map((comment, index) => (
            <div key={index} className="example-item">
              <span className="example-participant">Viewer:</span>
              <span className="example-comment">{comment}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
