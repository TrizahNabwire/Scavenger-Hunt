import { useState, useEffect } from 'react'
import { useBeemi } from './BeemiProvider'
import './VoteSimulator.css'

export default function VoteSimulator({ participants, isActive }) {
  const { beemi, isConnected } = useBeemi()
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationInterval, setSimulationInterval] = useState(null)
  const [isHost, setIsHost] = useState(false)

  // Check if current user is host
  useEffect(() => {
    if (!beemi || !isConnected) return

    // Check if user is host through Beemi SDK
    if (beemi.user && beemi.user.role === 'host') {
      setIsHost(true)
    } else if (beemi.streams && beemi.streams.user) {
      // Alternative check for host status
      setIsHost(beemi.streams.user.role === 'host')
    } else {
      // For development/testing, assume host if no specific role detected
      // In production, this should be more restrictive
      setIsHost(true)
    }
  }, [beemi, isConnected])

  const sendVoteEvent = (votedFor) => {
    if (!beemi || !isConnected || !isActive) return

    const voteEvent = {
      data: {
        user: {
          username: 'Viewer_' + Math.floor(Math.random() * 1000),
          displayName: 'Viewer_' + Math.floor(Math.random() * 1000)
        },
        vote: {
          player: votedFor
        },
        timestamp: new Date().toISOString()
      }
    }

    // Simulate the vote event
    const customEvent = new CustomEvent('beemi-vote', { detail: voteEvent })
    window.dispatchEvent(customEvent)
    
    if (window.voteHandler) {
      window.voteHandler(voteEvent)
    }

    console.log('🗳️ Simulated vote:', voteEvent)
  }

  const startVoteSimulation = () => {
    if (isSimulating || !participants || participants.length === 0) return

    setIsSimulating(true)
    const interval = setInterval(() => {
      const randomParticipant = participants[Math.floor(Math.random() * participants.length)]
      sendVoteEvent(randomParticipant)
    }, 3000) // Send a vote every 3 seconds

    setSimulationInterval(interval)
  }

  const stopVoteSimulation = () => {
    if (simulationInterval) {
      clearInterval(simulationInterval)
      setSimulationInterval(null)
    }
    setIsSimulating(false)
  }

  const sendSingleVote = (participant) => {
    sendVoteEvent(participant)
  }

  if (!isConnected || !isActive) {
    return (
      <div className="vote-simulator">
        <div className="simulator-header">
          <h3>🗳️ Vote Simulator</h3>
          <p>{!isConnected ? 'Waiting for Beemi connection...' : 'Competition not active'}</p>
        </div>
      </div>
    )
  }

  if (!participants || participants.length === 0) {
    return (
      <div className="vote-simulator">
        <div className="simulator-header">
          <h3>🗳️ Vote Simulator</h3>
          <p>No participants available for voting</p>
          {isHost ? (
            <button className="start-competition-button" onClick={() => window.location.reload()}>
              🎯 Start Competition
            </button>
          ) : (
            <div className="waiting-for-host">
              <span className="host-message">⏳ Waiting for host to start...</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="vote-simulator">
      <div className="simulator-header">
        <h3>🗳️ Vote Simulator</h3>
        <p>Test viewer voting during final competition</p>
      </div>

      <div className="simulator-controls">
        <button 
          className={`simulate-button ${isSimulating ? 'stop' : 'start'}`}
          onClick={isSimulating ? stopVoteSimulation : startVoteSimulation}
        >
          {isSimulating ? '⏹️ Stop Vote Simulation' : '▶️ Start Vote Simulation'}
        </button>
      </div>

      {isSimulating && (
        <div className="simulation-status">
          <span className="status-indicator">🟢</span>
          <span>Simulating votes every 3 seconds...</span>
        </div>
      )}

      <div className="participant-votes">
        <h4>Vote for Participants:</h4>
        <div className="vote-buttons">
          {participants.map((participant, index) => (
            <button 
              key={participant}
              className="participant-vote-button"
              onClick={() => sendSingleVote(participant)}
              disabled={isSimulating}
            >
              Vote for {participant}
            </button>
          ))}
        </div>
      </div>

      <div className="voting-info">
        <h4>Voting Instructions:</h4>
        <div className="info-content">
          <p>• Viewers can vote for who they think will find the item first</p>
          <p>• Votes are tracked in real-time during the competition</p>
          <p>• Use the buttons above to simulate viewer votes</p>
          <p>• Or start automatic simulation to generate random votes</p>
        </div>
      </div>
    </div>
  )
}

