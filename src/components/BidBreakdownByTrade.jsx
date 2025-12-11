import { useState, useEffect } from 'react';
import { BarChart3, Loader2, AlertCircle } from 'lucide-react';
import { projectsAPI, bidsAPI } from '../services/api';
import './BidBreakdownByTrade.css';

function BidBreakdownByTrade() {
  const [bidBreakdown, setBidBreakdown] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadBidBreakdown();
  }, []);

  const parseTradesFromDescription = (description) => {
    if (!description) return [];
    
    // Look for "Trades: ..." pattern in description
    const tradesMatch = description.match(/Trades:\s*([^\n]+)/i);
    if (tradesMatch) {
      const trades = tradesMatch[1]
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)
        .map(t => {
          // Normalize trade name (capitalize first letter, rest lowercase)
          return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
        });
      return trades;
    }
    return [];
  };

  const matchBidToTrade = (bid, projectTrades) => {
    // If project only needs one trade, assign bid to that trade
    if (projectTrades.length === 1) {
      return projectTrades[0];
    }
    
    // Try to match subcontractor's trade to one of the project's trades
    if (bid.sub_trade) {
      const normalizedSubTrade = bid.sub_trade.charAt(0).toUpperCase() + bid.sub_trade.slice(1).toLowerCase();
      const match = projectTrades.find(trade => 
        trade.toLowerCase() === normalizedSubTrade.toLowerCase() ||
        trade.toLowerCase().includes(normalizedSubTrade.toLowerCase()) ||
        normalizedSubTrade.toLowerCase().includes(trade.toLowerCase())
      );
      if (match) {
        return match;
      }
    }
    
    // If no match found, assign to first trade (or could be 'Other')
    // For now, assign to first trade since the project needs it
    return projectTrades[0] || 'Other';
  };

  const loadBidBreakdown = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch all projects for the GC
      const projectsResponse = await projectsAPI.getGCProjects();
      const projects = projectsResponse.data || [];

      // Track trades and their bid counts dynamically
      const tradeCounts = {};
      
      for (const project of projects) {
        try {
          // Parse trades needed for this project from description
          const projectTrades = parseTradesFromDescription(project.description);
          
          // If no trades found in description, skip this project
          if (projectTrades.length === 0) {
            continue;
          }

          // Fetch bids for this project
          const bidsResponse = await bidsAPI.getProjectBids(project.id);
          const bids = bidsResponse.data || [];
          
          // For each bid, match it to a specific trade
          for (const bid of bids) {
            const trade = matchBidToTrade(bid, projectTrades);
            
            // Count by trade
            if (!tradeCounts[trade]) {
              tradeCounts[trade] = 0;
            }
            tradeCounts[trade]++;
          }
        } catch (err) {
          // Skip projects where we can't fetch bids
          console.error(`Failed to fetch bids for project ${project.id}:`, err);
        }
      }

      setBidBreakdown(tradeCounts);
    } catch (err) {
      setError(err.message || 'Failed to load bid breakdown');
      console.error('Failed to load bid breakdown:', err);
    } finally {
      setLoading(false);
    }
  };

  // Sort trades by count (descending)
  const sortedTrades = Object.entries(bidBreakdown)
    .sort((a, b) => b[1] - a[1]);

  const totalBids = Object.values(bidBreakdown).reduce((sum, count) => sum + count, 0);

  if (loading) {
    return (
      <div className="bid-breakdown-card">
        <div className="bid-breakdown-loading">
          <Loader2 size={20} className="animate-spin" />
          <span>Loading bid breakdown...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bid-breakdown-card">
        <div className="bid-breakdown-error">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      </div>
    );
  }

  if (totalBids === 0) {
    return (
      <div className="bid-breakdown-card">
        <div className="bid-breakdown-header">
          <BarChart3 size={20} />
          <h3>Bids by Trade</h3>
        </div>
        <div className="bid-breakdown-empty">
          <p>No bids received yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bid-breakdown-card">
      <div className="bid-breakdown-header">
        <BarChart3 size={20} />
        <h3>Bids by Trade</h3>
      </div>
      <div className="bid-breakdown-content">
        {sortedTrades.map(([trade, count]) => (
          <div key={trade} className="bid-breakdown-item">
            <div className="bid-breakdown-trade">
              <span className="trade-name">{trade}</span>
            </div>
            <div className="bid-breakdown-count">
              <span className="count-value">{count}</span>
              <span className="count-label">{count === 1 ? 'bid' : 'bids'}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="bid-breakdown-footer">
        <span className="total-bids">Total: {totalBids} {totalBids === 1 ? 'bid' : 'bids'}</span>
      </div>
    </div>
  );
}

export default BidBreakdownByTrade;

