#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

// Standardized NFL Team Abbreviation Map
const TEAM_MAP = {
  'JAC': 'JAX',
  'KCC': 'KC',
  'TBB': 'TB',
  'SFO': 'SF',
  'LVR': 'LV',
  'WSH': 'WAS',
  'WFT': 'WAS',
  'ARZ': 'ARI',
  'CLV': 'CLE',
  'BLT': 'BAL',
  'HST': 'HOU',
  'LA': 'LAR',
  'NO': 'NO'
};

const VALID_POSITIONS = new Set(['QB', 'RB', 'WR', 'TE', 'K', 'DEF', 'DST', 'FLX', 'FLEX']);

function normalizeTeam(team) {
  if (!team) return '';
  const upper = team.trim().toUpperCase();
  return TEAM_MAP[upper] || upper;
}

function normalizePos(pos) {
  if (!pos) return '';
  let upper = pos.trim().toUpperCase();
  if (upper === 'DST') return 'DEF';
  return upper;
}

function cleanPlayerName(name) {
  if (!name) return '';
  let cleaned = name.replace(/^\d+[\.\)\s]+/, '').replace(/\s+/g, ' ').trim();
  // Handle "Last, First" or "Last, First Jr." format
  if (cleaned.includes(',')) {
    const parts = cleaned.split(',').map(p => p.trim());
    if (parts.length >= 2 && parts[1]) {
      cleaned = `${parts[1]} ${parts[0]}`;
    }
  }
  return cleaned;
}

/**
 * Parses raw text/TSV into standardized player ranking objects
 */
export function convertToRankingsCsv(rawText) {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) return '';

  const results = [];
  let autoRank = 1;

  // Check header line
  let headerMap = null;
  const firstLine = lines[0];
  if (firstLine.toLowerCase().includes('player')) {
    const headerCols = firstLine.split(/\t|,/).map(h => h.trim().toLowerCase());
    const rankIdx = headerCols.findIndex(h => h === 'rank' || h.includes('rank'));
    const playerIdx = headerCols.findIndex(h => h === 'player' || h.includes('name'));
    const teamIdx = headerCols.findIndex(h => h === 'team');
    const posIdx = headerCols.findIndex(h => h.includes('position') || h === 'pos');

    if (playerIdx >= 0) {
      headerMap = { rankIdx, playerIdx, teamIdx, posIdx };
    }
  }

  const startIndex = headerMap ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];

    let tokens = [];
    if (line.includes('\t')) {
      tokens = line.split('\t').map(t => t.trim());
    } else if (line.includes(',')) {
      tokens = line.split(',').map(t => t.trim());
    } else if (line.includes('|')) {
      tokens = line.split('|').map(t => t.trim());
    } else {
      tokens = line.split(/\s+/);
    }

    if (tokens.length === 0) continue;

    let rank = null;
    let player = '';
    let team = '';
    let position = '';

    if (headerMap && tokens.length > headerMap.playerIdx) {
      if (headerMap.rankIdx >= 0 && tokens[headerMap.rankIdx]) {
        const parsedRank = parseInt(tokens[headerMap.rankIdx], 10);
        if (!isNaN(parsedRank)) rank = parsedRank;
      }
      player = cleanPlayerName(tokens[headerMap.playerIdx]);
      if (headerMap.teamIdx >= 0 && tokens[headerMap.teamIdx]) {
        team = normalizeTeam(tokens[headerMap.teamIdx]);
      }
      if (headerMap.posIdx >= 0 && tokens[headerMap.posIdx]) {
        position = normalizePos(tokens[headerMap.posIdx]);
      }
    } else {
      // Fallback parser without header map
      const matchLeadRank = tokens[0].match(/^(\d+)[\.\)\s]+(.*)$/);
      if (matchLeadRank) {
        rank = parseInt(matchLeadRank[1], 10);
        const namePart = matchLeadRank[2].trim();
        if (namePart) {
          tokens[0] = namePart;
        } else {
          tokens.shift();
        }
      } else if (!isNaN(parseInt(tokens[0], 10)) && tokens.length > 1 && /^\d+$/.test(tokens[0])) {
        rank = parseInt(tokens[0], 10);
        tokens.shift();
      }

      if (tokens.length >= 3) {
        player = cleanPlayerName(tokens[0]);
        team = normalizeTeam(tokens[1]);
        position = normalizePos(tokens[2]);
      } else if (tokens.length === 2) {
        player = cleanPlayerName(tokens[0]);
        const tok1Upper = tokens[1].toUpperCase();
        if (VALID_POSITIONS.has(tok1Upper)) {
          position = normalizePos(tok1Upper);
        } else {
          team = normalizeTeam(tok1Upper);
        }
      } else if (tokens.length === 1) {
        player = cleanPlayerName(tokens[0]);
      }
    }

    if (!player) continue;

    results.push({
      rank: rank || autoRank,
      player,
      team: team || '',
      position: position || ''
    });

    autoRank++;
  }

  // Format as clean CSV
  const csvLines = ['Rank,Player,Team,Position'];
  results.forEach(item => {
    csvLines.push(`${item.rank},${item.player},${item.team},${item.position}`);
  });

  return csvLines.join('\n');
}

// CLI Execution Support
const args = process.argv.slice(2);
if (args.length > 0) {
  const inputFilePath = path.resolve(args[0]);
  if (fs.existsSync(inputFilePath)) {
    const rawContent = fs.readFileSync(inputFilePath, 'utf-8');
    const csvOutput = convertToRankingsCsv(rawContent);
    const outputPath = args[1] ? path.resolve(args[1]) : inputFilePath.replace(/\.[^/.]+$/, '') + '_formatted.csv';
    fs.writeFileSync(outputPath, csvOutput, 'utf-8');
    console.log(`Converted rankings successfully saved to: ${outputPath}`);
  } else {
    console.error(`Input file not found: ${inputFilePath}`);
    process.exit(1);
  }
}
