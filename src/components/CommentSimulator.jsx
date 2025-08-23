import { useState } from 'react'
import { useBeemi } from './BeemiProvider'
import './CommentSimulator.css'

export default function CommentSimulator({ participants, isActive }) {
  const { beemi, isConnected } = useBeemi()
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationInterval, setSimulationInterval] = useState(null)
  const [customMessage, setCustomMessage] = useState('')

  const commentTemplates = [
    'I think {participant} will win!',
    'Go {participant}!',
    '{participant} is going to find it first',
    'Vote for {participant}',
    '{participant} has this in the bag',
    'My money is on {participant}',
    '{participant} will definitely win',
    'Good luck {participant}!',
    'I believe in {participant}',
    '{participant} is the best!'
  ]

  const sendCommentEvent = (message, username) => {
    if (!beemi || !isConnected || !isActive) return

    const commentEvent = {
      data: {
        user: {
          username: username,
          displayName: username
        },
        message: message,
        timestamp: new Date().toISOString()
      }
    }

    // Simulate the comment event
    const customEvent = new CustomEvent('beemi-chat', { detail: commentEvent })
    window.dispatchEvent(customEvent)
    
    // Also dispatch to the chat handler if available
    if (window.chatHandler) {
      window.chatHandler(commentEvent)
    }

    console.log('💬 Simulated comment:', commentEvent)
  }

  const sendRandomComment = () => {
    if (!participants || participants.length === 0) return

    const randomParticipant = participants[Math.floor(Math.random() * participants.length)]
    const randomTemplate = commentTemplates[Math.floor(Math.random() * commentTemplates.length)]
    const message = randomTemplate.replace('{participant}', randomParticipant)
    const username = 'Viewer_' + Math.floor(Math.random() * 1000)

    sendCommentEvent(message, username)
  }

  const sendCustomComment = () => {
    if (!customMessage.trim()) return

    const username = 'Viewer_' + Math.floor(Math.random() * 1000)
    sendCommentEvent(customMessage, username)
    setCustomMessage('')
  }

  const startCommentSimulation = () => {
    if (isSimulating || !participants || participants.length === 0) return

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

  const sendParticipantComment = (participant) => {
    const randomTemplate = commentTemplates[Math.floor(Math.random() * commentTemplates.length)]
    const message = randomTemplate.replace('{participant}', participant)
    const username = 'Viewer_' + Math.floor(Math.random() * 1000)
    sendCommentEvent(message, username)
  }

  if (!isConnected || !isActive) {
    return (
      <div className="comment-simulator">
        <div className="simulator-header">
          <h3>💬 Comment Simulator</h3>
          <p>{!isConnected ? 'Waiting for Beemi connection...' : 'Competition not active'}</p>
        </div>
      </div>
    )
  }

  if (!participants || participants.length === 0) {
    return (
      <div className="comment-simulator">
        <div className="simulator-header">
          <h3>💬 Comment Simulator</h3>
          <p>No participants available for commenting</p>
        </div>
      </div>
    )
  }

  return (
    <div className="comment-simulator">
      <div className="simulator-header">
        <h3>💬 Comment Simulator</h3>
        <p>Test how comments with participant names count as votes</p>
      </div>

      <div className="simulator-controls">
        <button 
          className={`simulate-button ${isSimulating ? 'stop' : 'start'}`}
          onClick={isSimulating ? stopCommentSimulation : startCommentSimulation}
        >
          {isSimulating ? '⏹️ Stop Comment Simulation' : '▶️ Start Comment Simulation'}
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
            value={customMessage}
            onChange={(e) => setCustomMessage(e.target.value)}
            placeholder="Type a message with a participant name..."
            className="comment-input"
            disabled={isSimulating}
          />
          <button 
            className="send-comment-button"
            onClick={sendCustomComment}
            disabled={!customMessage.trim() || isSimulating}
          >
            Send
          </button>
        </div>
      </div>

      <div className="participant-comments">
        <h4>Quick Comment for Participants:</h4>
        <div className="comment-buttons">
          {participants.map((participant, index) => (
            <button 
              key={participant}
              className="participant-comment-button"
              onClick={() => sendParticipantComment(participant)}
              disabled={isSimulating}
            >
              Comment for {participant}
            </button>
          ))}
        </div>
      </div>

      <div className="comment-info">
        <h4>How Comment Voting Works:</h4>
        <div className="info-content">
          <p>• Comments containing participant names count as votes</p>
          <p>• Names are matched case-insensitively</p>
          <p>• Examples: "Go host!", "Alice will win", "Vote for Bob"</p>
          <p>• Each viewer can only vote once (latest comment counts)</p>
          <p>• Use the buttons above or type custom messages</p>
        </div>
      </div>

      <div className="example-comments">
        <h4>Example Comments That Count as Votes:</h4>
        <div className="examples-list">
          {participants.map(participant => (
            <div key={participant} className="example-item">
              <span className="example-participant">{participant}:</span>
              <span className="example-comment">"I think {participant} will find it first!"</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
