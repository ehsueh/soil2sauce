import React, { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { useWatchContractEvent, useAccount } from 'wagmi'
import { useQueryClient } from '@tanstack/react-query'
import { CONTRACT_ADDRESSES } from '../contracts/addresses'
import GameRegistryABI from '../contracts/GameRegistry.json'
import PlantSystemABI from '../contracts/PlantSystem.json'
import ShopSystemABI from '../contracts/ShopSystem.json'
import LivestockSystemABI from '../contracts/LivestockSystem.json'

const EventContext = createContext(null)

/**
 * Custom hook to access event context
 * Must be used within EventProvider
 */
export const useEventContext = () => {
  const context = useContext(EventContext)
  if (!context) {
    throw new Error('useEventContext must be used within EventProvider')
  }
  return context
}

/**
 * EventProvider - Centralized blockchain event listener
 * Watches contract events and automatically invalidates React Query caches
 */
export const EventProvider = ({ children }) => {
  const { address: connectedAddress } = useAccount()
  const queryClient = useQueryClient()

  // Store event history (last 100 events)
  const [eventHistory, setEventHistory] = useState([])

  // Track processed events to avoid duplicates using txHash + logIndex
  const [processedEventKeys, setProcessedEventKeys] = useState(new Set())

  /**
   * Create unique event key from transaction hash and log index
   */
  const createEventKey = (log) => {
    return `${log.transactionHash}-${log.logIndex}`
  }

  /**
   * Check if event has already been processed
   */
  const isEventProcessed = useCallback((eventKey) => {
    return processedEventKeys.has(eventKey)
  }, [processedEventKeys])

  /**
   * Mark event as processed to prevent duplicates
   */
  const markEventProcessed = useCallback((eventKey) => {
    setProcessedEventKeys(prev => new Set([...prev, eventKey]))
  }, [])

  /**
   * Invalidate React Query caches based on contract and event type
   */
  const invalidateQueriesForEvent = useCallback((contractName, eventName) => {
    console.log(`[EventProvider] Invalidating caches for ${contractName}.${eventName}`)

    switch (contractName) {
      case 'GameRegistry':
        if (eventName === 'PlayerRegistered') {
          queryClient.invalidateQueries({ queryKey: ['playerRegistration'] })
          queryClient.invalidateQueries({ queryKey: ['inventory'] })
          queryClient.invalidateQueries({ queryKey: ['currencies'] })
          console.log('[EventProvider] Invalidated: playerRegistration, inventory, currencies')
        }
        break

      case 'PlantSystem':
        if (eventName === 'Planted') {
          queryClient.invalidateQueries({ queryKey: ['plots'] })
          queryClient.invalidateQueries({ queryKey: ['inventory'] })
          console.log('[EventProvider] Invalidated: plots, inventory')
        } else if (eventName === 'Harvested') {
          queryClient.invalidateQueries({ queryKey: ['plots'] })
          queryClient.invalidateQueries({ queryKey: ['inventory'] })
          queryClient.invalidateQueries({ queryKey: ['currencies'] })
          console.log('[EventProvider] Invalidated: plots, inventory, currencies')
        }
        break

      case 'ShopSystem':
        if (eventName === 'ItemPurchased') {
          queryClient.invalidateQueries({ queryKey: ['inventory'] })
          queryClient.invalidateQueries({ queryKey: ['currencies'] })
          console.log('[EventProvider] Invalidated: inventory, currencies')
        }
        break

      case 'LivestockSystem':
        if (eventName === 'ProductsClaimed') {
          queryClient.invalidateQueries({ queryKey: ['inventory'] })
          queryClient.invalidateQueries({ queryKey: ['livestock'] })
          console.log('[EventProvider] Invalidated: inventory, livestock')
        }
        break

      default:
        console.warn(`[EventProvider] Unknown contract: ${contractName}`)
    }
  }, [queryClient])

  /**
   * Add event to history and trigger cache invalidation
   */
  const addEventToHistory = useCallback((contractName, eventName, log) => {
    const eventKey = createEventKey(log)

    // Deduplicate events
    if (isEventProcessed(eventKey)) {
      console.log(`[EventProvider] Duplicate event ignored: ${contractName}.${eventName}`, eventKey)
      return
    }

    markEventProcessed(eventKey)

    const eventData = {
      contractName,
      eventName,
      args: log.args,
      transactionHash: log.transactionHash,
      logIndex: log.logIndex,
      blockNumber: log.blockNumber,
      timestamp: Date.now(),
      eventKey
    }

    console.log(`[EventProvider] New event received: ${contractName}.${eventName}`, {
      player: log.args.player || log.args.buyer,
      txHash: log.transactionHash,
      args: log.args
    })

    // Add to history (keep last 100 events)
    setEventHistory(prev => [eventData, ...prev].slice(0, 100))

    // Invalidate relevant queries
    invalidateQueriesForEvent(contractName, eventName)
  }, [isEventProcessed, markEventProcessed, invalidateQueriesForEvent])

  /**
   * Get recent events filtered by contract and event name
   */
  const getRecentEvents = useCallback((contractName, eventName) => {
    const filtered = eventHistory.filter(event =>
      event.contractName === contractName &&
      event.eventName === eventName
    )
    console.log(`[EventProvider] getRecentEvents(${contractName}, ${eventName}): ${filtered.length} events`)
    return filtered
  }, [eventHistory])

  /**
   * Get the most recent event for a specific contract and event type
   */
  const getLastEvent = useCallback((contractName, eventName) => {
    const events = getRecentEvents(contractName, eventName)
    const lastEvent = events.length > 0 ? events[0] : null
    console.log(`[EventProvider] getLastEvent(${contractName}, ${eventName}):`, lastEvent ? 'found' : 'none')
    return lastEvent
  }, [getRecentEvents])

  // ========================================
  // GameRegistry Event Listeners
  // ========================================

  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.GameRegistry,
    abi: GameRegistryABI,
    eventName: 'PlayerRegistered',
    onLogs(logs) {
      logs.forEach(log => {
        // Filter: only process events for connected wallet
        if (log.args.player?.toLowerCase() === connectedAddress?.toLowerCase()) {
          addEventToHistory('GameRegistry', 'PlayerRegistered', log)
        } else {
          console.log('[EventProvider] PlayerRegistered event ignored (different player)')
        }
      })
    },
    enabled: !!connectedAddress,
  })

  // ========================================
  // PlantSystem Event Listeners
  // ========================================

  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.PlantSystem,
    abi: PlantSystemABI,
    eventName: 'Planted',
    onLogs(logs) {
      logs.forEach(log => {
        // Filter: only process events for connected wallet
        if (log.args.player?.toLowerCase() === connectedAddress?.toLowerCase()) {
          addEventToHistory('PlantSystem', 'Planted', log)
        } else {
          console.log('[EventProvider] Planted event ignored (different player)')
        }
      })
    },
    enabled: !!connectedAddress,
  })

  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.PlantSystem,
    abi: PlantSystemABI,
    eventName: 'Harvested',
    onLogs(logs) {
      logs.forEach(log => {
        // Filter: only process events for connected wallet
        if (log.args.player?.toLowerCase() === connectedAddress?.toLowerCase()) {
          addEventToHistory('PlantSystem', 'Harvested', log)
        } else {
          console.log('[EventProvider] Harvested event ignored (different player)')
        }
      })
    },
    enabled: !!connectedAddress,
  })

  // Placeholder: PlotUnlocked event listener
  // useWatchContractEvent({
  //   address: CONTRACT_ADDRESSES.PlantSystem,
  //   abi: PlantSystemABI.abi,
  //   eventName: 'PlotUnlocked',
  //   onLogs(logs) {
  //     logs.forEach(log => {
  //       if (log.args.player?.toLowerCase() === connectedAddress?.toLowerCase()) {
  //         addEventToHistory('PlantSystem', 'PlotUnlocked', log)
  //       }
  //     })
  //   },
  //   enabled: !!connectedAddress,
  // })

  // ========================================
  // ShopSystem Event Listeners
  // ========================================

  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.ShopSystem,
    abi: ShopSystemABI,
    eventName: 'ItemPurchased',
    onLogs(logs) {
      logs.forEach(log => {
        // Filter: only process events for connected wallet (uses 'buyer' field)
        if (log.args.buyer?.toLowerCase() === connectedAddress?.toLowerCase()) {
          addEventToHistory('ShopSystem', 'ItemPurchased', log)
        } else {
          console.log('[EventProvider] ItemPurchased event ignored (different buyer)')
        }
      })
    },
    enabled: !!connectedAddress,
  })

  // ========================================
  // LivestockSystem Event Listeners
  // ========================================

  useWatchContractEvent({
    address: CONTRACT_ADDRESSES.LivestockSystem,
    abi: LivestockSystemABI,
    eventName: 'ProductsClaimed',
    onLogs(logs) {
      logs.forEach(log => {
        // Filter: only process events for connected wallet
        if (log.args.player?.toLowerCase() === connectedAddress?.toLowerCase()) {
          addEventToHistory('LivestockSystem', 'ProductsClaimed', log)
        } else {
          console.log('[EventProvider] ProductsClaimed event ignored (different player)')
        }
      })
    },
    enabled: !!connectedAddress,
  })

  // ========================================
  // Cleanup
  // ========================================

  useEffect(() => {
    if (connectedAddress) {
      console.log(`[EventProvider] Watching events for wallet: ${connectedAddress}`)
    }

    return () => {
      console.log('[EventProvider] Cleaning up event listeners')
      // Clear state on unmount or wallet change
      setEventHistory([])
      setProcessedEventKeys(new Set())
    }
  }, [connectedAddress])

  const value = {
    eventHistory,
    getRecentEvents,
    getLastEvent,
  }

  return (
    <EventContext.Provider value={value}>
      {children}
    </EventContext.Provider>
  )
}
