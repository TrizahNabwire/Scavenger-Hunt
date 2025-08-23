import { useState, useEffect } from 'react'
import { useBeemi } from './BeemiProvider'
import './GiftCompetition.css'

export default function GiftCompetition({ isActive, onCompetitionEnd }) {
  const { beemi, isConnected } = useBeemi()
  const [timeLeft, setTimeLeft] = useState(40)
  const [gifters, setGifters] = useState({})
  const [isRunning, setIsRunning] = useState(false)
  const [topGifters, setTopGifters] = useState([])

  // Start the competition
  const startCompetition = () => {
    setIsRunning(true)
    setTimeLeft(40)
    setGifters({})
    setTopGifters([])
  }

  // Handle gift events
  useEffect(() => {
    if (!isConnected || !beemi || !isRunning) return

    const handleGift = (event) => {
      console.log('🎁 Gift event received:', event)
      
      // Handle different gift event formats
      let giftData = null
      
      if (event.data && event.data.gift) {
        giftData = {
          username: event.data.user?.username || event.data.user?.displayName || event.data.user,
          giftName: event.data.gift.name || event.data.gift.giftName,
          giftValue: event.data.gift.value || event.data.gift.coins || 1,
          giftCount: event.data.gift.count || 1
        }
      } else if (event.gift) {
        giftData = {
          username: event.user?.username || event.user?.displayName || event.user,
          giftName: event.gift.name || event.gift.giftName,
          giftValue: event.gift.value || event.gift.coins || 1,
          giftCount: event.gift.count || 1
        }
      }

      if (giftData) {
        setGifters(prev => {
          const currentGifter = prev[giftData.username] || {
            username: giftData.username,
            totalValue: 0,
            giftCount: 0,
            gifts: []
          }

          const updatedGifter = {
            ...currentGifter,
            totalValue: currentGifter.totalValue + (giftData.giftValue * giftData.giftCount),
            giftCount: currentGifter.giftCount + giftData.giftCount,
            gifts: [...currentGifter.gifts, {
              name: giftData.giftName,
              value: giftData.giftValue,
              count: giftData.giftCount,
              timestamp: Date.now()
            }]
          }

          return {
            ...prev,
            [giftData.username]: updatedGifter
          }
        })
      }
    }

    // Listen for gift events from Beemi SDK
    if (beemi.streams) {
      beemi.streams.onGift(handleGift)
    }

    // Listen for simulated gift events
    const handleSimulatedGift = (event) => {
      handleGift(event.detail)
    }

    window.addEventListener('beemi-gift', handleSimulatedGift)
    
    // Store the handler globally for direct access
    window.giftHandler = handleGift

    return () => {
      window.removeEventListener('beemi-gift', handleSimulatedGift)
      delete window.giftHandler
      
      if (beemi && beemi.streams) {
        // Note: streams.onGift doesn't have an off method, it's a one-time registration
      }
    }
  }, [beemi, isConnected, isRunning])

  // Timer countdown
  useEffect(() => {
    if (!isRunning || timeLeft <= 0) return

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [isRunning, timeLeft])

  // Calculate top gifters when competition ends
  useEffect(() => {
    if (!isRunning && timeLeft === 0) {
      const sortedGifters = Object.values(gifters)
        .sort((a, b) => b.totalValue - a.totalValue)
        .slice(0, 2)
      
      setTopGifters(sortedGifters)
      
      if (onCompetitionEnd) {
        onCompetitionEnd(sortedGifters)
      }
    }
  }, [isRunning, timeLeft, gifters, onCompetitionEnd])

  if (!isActive) return null

  return (
    <div className="gift-competition">
      <div className="competition-header">
        <h2>🎁 Gift Competition</h2>
        {!isRunning && timeLeft === 40 && (
          <button className="start-button" onClick={startCompetition}>
            Start Competition
          </button>
        )}
      </div>

      {isRunning && (
        <div className="timer-section">
          <div className="timer">
            <span className="timer-label">Time Remaining:</span>
            <span className="timer-value">{timeLeft}s</span>
          </div>
          <div className="competition-status">
            <span className="status-text">🎯 Competing for top 2 spots!</span>
          </div>
        </div>
      )}

      {timeLeft === 0 && (
        <div className="results-section">
          <h3>🏆 Competition Results</h3>
          {topGifters.length > 0 ? (
            <div className="winners">
              {topGifters.map((gifter, index) => (
                <div key={gifter.username} className={`winner-card ${index === 0 ? 'first-place' : 'second-place'}`}>
                  <div className="winner-rank">#{index + 1}</div>
                  <div className="winner-info">
                    <div className="winner-name">{gifter.username}</div>
                    <div className="winner-stats">
                      <span>💰 {gifter.totalValue} coins</span>
                      <span>🎁 {gifter.giftCount} gifts</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-winners">No gifts received during competition</p>
          )}
        </div>
      )}

      {isRunning && (
        <div className="live-leaderboard">
          <h4>📊 Live Leaderboard</h4>
          <div className="leaderboard">
            {Object.values(gifters)
              .sort((a, b) => b.totalValue - a.totalValue)
              .slice(0, 5)
              .map((gifter, index) => (
                <div key={gifter.username} className="leaderboard-item">
                  <div className="rank">#{index + 1}</div>
                  <div className="gifter-name">{gifter.username}</div>
                  <div className="gifter-value">💰 {gifter.totalValue}</div>
                </div>
              ))}
            {Object.keys(gifters).length === 0 && (
              <p className="no-gifts">No gifts yet... Start gifting! 🌹</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
