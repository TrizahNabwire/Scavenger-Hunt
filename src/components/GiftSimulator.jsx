import { useState } from 'react'
import { useBeemi } from './BeemiProvider'
import './GiftSimulator.css'

export default function GiftSimulator() {
  const { beemi, isConnected } = useBeemi()
  const [isSimulating, setIsSimulating] = useState(false)
  const [simulationInterval, setSimulationInterval] = useState(null)

  const giftTypes = [
    { name: 'Rose', value: 10, emoji: '🌹' },
    { name: 'Diamond', value: 50, emoji: '💎' },
    { name: 'Crown', value: 100, emoji: '👑' },
    { name: 'Heart', value: 25, emoji: '❤️' },
    { name: 'Star', value: 75, emoji: '⭐' }
  ]

  const testUsers = [
    'Alice',
    'Bob',
    'Charlie',
    'Diana',
    'Eve',
    'Frank',
    'Grace',
    'Henry'
  ]

  const sendGiftEvent = (user, gift) => {
    if (!beemi || !isConnected) return

    const giftEvent = {
      data: {
        user: {
          username: user,
          displayName: user
        },
        gift: {
          name: gift.name,
          value: gift.value,
          count: Math.floor(Math.random() * 3) + 1
        },
        timestamp: new Date().toISOString()
      }
    }

    // Simulate the gift event by dispatching it to the streams
    if (beemi.streams && beemi.streams.onGift) {
      // Create a custom event to simulate gift
      const customEvent = new CustomEvent('beemi-gift', { detail: giftEvent })
      window.dispatchEvent(customEvent)
      
      // Also try to call the gift handler directly if available
      if (window.giftHandler) {
        window.giftHandler(giftEvent)
      }
    }

    console.log('🎁 Simulated gift:', giftEvent)
  }

  const startSimulation = () => {
    if (isSimulating) return

    setIsSimulating(true)
    const interval = setInterval(() => {
      const randomUser = testUsers[Math.floor(Math.random() * testUsers.length)]
      const randomGift = giftTypes[Math.floor(Math.random() * giftTypes.length)]
      sendGiftEvent(randomUser, randomGift)
    }, 2000) // Send a gift every 2 seconds

    setSimulationInterval(interval)
  }

  const stopSimulation = () => {
    if (simulationInterval) {
      clearInterval(simulationInterval)
      setSimulationInterval(null)
    }
    setIsSimulating(false)
  }

  const sendSingleGift = () => {
    const randomUser = testUsers[Math.floor(Math.random() * testUsers.length)]
    const randomGift = giftTypes[Math.floor(Math.random() * giftTypes.length)]
    sendGiftEvent(randomUser, randomGift)
  }

  if (!isConnected) {
    return (
      <div className="gift-simulator">
        <div className="simulator-header">
          <h3>🎁 Gift Simulator</h3>
          <p>Waiting for Beemi connection...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="gift-simulator">
      <div className="simulator-header">
        <h3>🎁 Gift Simulator</h3>
        <p>Test gift events for development</p>
      </div>

      <div className="simulator-controls">
        <button 
          className={`simulate-button ${isSimulating ? 'stop' : 'start'}`}
          onClick={isSimulating ? stopSimulation : startSimulation}
        >
          {isSimulating ? '⏹️ Stop Simulation' : '▶️ Start Simulation'}
        </button>
        
        <button 
          className="single-gift-button"
          onClick={sendSingleGift}
          disabled={isSimulating}
        >
          🎁 Send Single Gift
        </button>
      </div>

      {isSimulating && (
        <div className="simulation-status">
          <span className="status-indicator">🟢</span>
          <span>Simulating gifts every 2 seconds...</span>
        </div>
      )}

      <div className="gift-types">
        <h4>Available Gifts:</h4>
        <div className="gift-list">
          {giftTypes.map((gift, index) => (
            <div key={index} className="gift-item">
              <span className="gift-emoji">{gift.emoji}</span>
              <span className="gift-name">{gift.name}</span>
              <span className="gift-value">{gift.value} coins</span>
            </div>
          ))}
        </div>
      </div>

      <div className="test-users">
        <h4>Test Users:</h4>
        <div className="user-list">
          {testUsers.map((user, index) => (
            <span key={index} className="user-tag">{user}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

