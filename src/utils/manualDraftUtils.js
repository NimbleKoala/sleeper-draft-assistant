import { PREFERRED_USERNAME } from '../components/DraftConnectModal';

const MANUAL_DRAFT_KEY = 'sleeper_manual_draft_state';

/**
 * Reads saved manual draft state from localStorage
 */
export function getStoredManualDraft() {
  try {
    const raw = localStorage.getItem(MANUAL_DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.draftInfo) {
      return parsed;
    }
  } catch (err) {
    console.error('Failed to read stored manual draft:', err);
  }
  return null;
}

/**
 * Saves manual draft state to localStorage
 */
export function saveStoredManualDraft(draftState) {
  try {
    if (!draftState) {
      localStorage.removeItem(MANUAL_DRAFT_KEY);
      return;
    }
    localStorage.setItem(MANUAL_DRAFT_KEY, JSON.stringify({
      ...draftState,
      savedAt: new Date().toISOString()
    }));
  } catch (err) {
    console.error('Failed to save manual draft state:', err);
  }
}

/**
 * Clears stored manual draft
 */
export function clearStoredManualDraft() {
  try {
    localStorage.removeItem(MANUAL_DRAFT_KEY);
  } catch (err) {}
}

/**
 * Calculates round, pick in round, and draft slot for any pick number
 */
export function calculatePickDetails(pickNo, teamsCount = 12, draftType = 'snake') {
  const safeTeams = Math.max(1, Number(teamsCount) || 12);
  const round = Math.ceil(pickNo / safeTeams);
  const indexInRound = (pickNo - 1) % safeTeams; // 0 to teamsCount - 1
  const pickInRound = indexInRound + 1;

  const isReversed = draftType === 'snake' && round % 2 === 0;
  const slot = isReversed ? (safeTeams - indexInRound) : (indexInRound + 1);

  return {
    pickNo,
    round,
    pickInRound,
    slot,
    isReversed
  };
}

/**
 * Creates a normalized draftInfo object for a manual draft session
 */
export function createManualDraft({
  name = 'Manual League Draft',
  teamsCount = 12,
  roundsCount = 15,
  draftType = 'snake',
  myDraftSlot = 1,
  customTeamNames = {},
  preferredUsername = PREFERRED_USERNAME
}) {
  const teams = Math.min(24, Math.max(2, Number(teamsCount) || 12));
  const rounds = Math.min(35, Math.max(1, Number(roundsCount) || 15));
  const mySlot = Math.min(teams, Math.max(1, Number(myDraftSlot) || 1));
  const draftId = `manual_${Date.now()}`;

  const users = [];
  const draftOrder = {};
  const slotToRoster = {};

  for (let slot = 1; slot <= teams; slot++) {
    const userId = `manual_user_${slot}`;
    const isMe = slot === mySlot;
    const defaultName = isMe ? `${preferredUsername} (Me)` : `Team ${slot}`;
    const displayName = (customTeamNames[slot] && customTeamNames[slot].trim()) || defaultName;

    users.push({
      user_id: userId,
      display_name: displayName,
      username: isMe ? preferredUsername : `team_${slot}`,
      is_owner: isMe
    });

    draftOrder[userId] = slot;
    slotToRoster[slot] = slot;
  }

  return {
    draft_id: draftId,
    status: 'drafting',
    type: draftType,
    isManualDraft: true,
    myDraftSlot: mySlot,
    metadata: {
      name: name.trim() || 'Manual League Draft'
    },
    settings: {
      teams,
      rounds
    },
    users,
    draft_order: draftOrder,
    slot_to_roster_id: slotToRoster,
    createdAt: new Date().toISOString()
  };
}

/**
 * Exports draft picks to a formatted CSV string
 */
export function exportDraftToCsv(draftInfo, picks = []) {
  const headers = ['Overall Pick', 'Round', 'Pick In Round', 'Draft Slot', 'Team', 'Player', 'Position', 'NFL Team'];
  const rows = [headers.join(',')];

  const teamsCount = draftInfo?.settings?.teams || 12;
  const draftType = draftInfo?.type || 'snake';

  picks.forEach((p) => {
    const { round, pickInRound, slot } = calculatePickDetails(p.pick_no, teamsCount, draftType);
    const meta = p.metadata || {};
    const playerName = `${meta.first_name || ''} ${meta.last_name || ''}`.trim() || 'Unknown Player';
    const escapedPlayer = playerName.includes(',') ? `"${playerName}"` : playerName;
    const teamName = p.picked_by_name || `Team ${slot}`;
    const escapedTeam = teamName.includes(',') ? `"${teamName}"` : teamName;

    rows.push([
      p.pick_no,
      round,
      pickInRound,
      slot,
      escapedTeam,
      escapedPlayer,
      meta.position || '',
      meta.team || ''
    ].join(','));
  });

  return rows.join('\n');
}

/**
 * Exports draft picks to formatted text
 */
export function exportDraftToText(draftInfo, picks = []) {
  const leagueName = draftInfo?.metadata?.name || 'Manual Draft';
  const teamsCount = draftInfo?.settings?.teams || 12;
  const draftType = draftInfo?.type || 'snake';

  let text = `=== ${leagueName.toUpperCase()} DRAFT SUMMARY ===\n`;
  text += `Type: ${draftType.toUpperCase()} | Teams: ${teamsCount} | Total Picks: ${picks.length}\n\n`;

  let currentRound = 0;
  picks.forEach((p) => {
    const { round, pickInRound, slot } = calculatePickDetails(p.pick_no, teamsCount, draftType);
    if (round !== currentRound) {
      currentRound = round;
      text += `--- ROUND ${round} ---\n`;
    }
    const meta = p.metadata || {};
    const playerName = `${meta.first_name || ''} ${meta.last_name || ''}`.trim() || 'Unknown Player';
    const teamName = p.picked_by_name || `Slot ${slot}`;
    text += `${p.pick_no}. (Rd ${round}.${pickInRound < 10 ? '0' + pickInRound : pickInRound}) [${teamName}]: ${playerName} (${meta.position} - ${meta.team})\n`;
  });

  return text;
}
