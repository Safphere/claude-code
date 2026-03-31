import React, { useState } from 'react'
import { Box, Text } from '../../ink.js'
import type { CommandResultDisplay } from '../../commands.js'
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js'
import { roll, companionUserId } from '../../buddy/companion.js'
import { RARITY_STARS, RARITY_COLORS, SPECIES, STAT_NAMES } from '../../buddy/types.js'
import { renderSprite, renderFace } from '../../buddy/sprites.js'
import { logError } from '../../utils/log.js'

function BuddyInfo(): CommandResultDisplay {
  const config = getGlobalConfig()
  const userId = companionUserId()
  const r = roll(userId)

  const lines: string[] = []
  lines.push('')
  lines.push(`  You rolled a ${RARITY_STARS[r.bones.rarity]} ${r.bones.rarity} ${r.bones.species}!`)
  if (r.bones.hat !== 'none') lines.push(`  Wearing a ${r.bones.hat}!`)
  if (r.bones.shiny) lines.push(`  *** SHINY! ***`)
  lines.push('')
  for (const stat of STAT_NAMES) {
    const val = r.bones.stats[stat]
    const bar = '█'.repeat(Math.floor(val / 10)) + '░'.repeat(10 - Math.floor(val / 10))
    lines.push(`  ${stat.padEnd(10)} ${bar} ${val}`)
  }

  lines.push('')
  const spriteLines = renderSprite(r.bones, 0)
  for (const line of spriteLines) {
    lines.push('  ' + line)
  }
  lines.push('')

  return {
    type: 'inline',
    jsx: <Box flexDirection="column" paddingX={1}>
      {lines.map((line, i) => <Text key={i}>{line}</Text>)}
    </Box>,
    onDone: () => {
      // Adopt/hatch this companion with a default name
      if (!config.companion) {
        try {
          const defaultNames: Record<string, string> = {
            duck: 'Quackers', goose: 'Goosey', blob: 'Blobby',
            cat: 'Whiskers', dragon: 'Ember', octopus: 'Inky',
            owl: 'Hoot', penguin: 'Waddle', turtle: 'Shelly',
            snail: 'Speedy', ghost: 'Casper', axolotl: 'Axie',
            capybara: 'Cappy', cactus: 'Spike', robot: 'Beep',
            rabbit: 'Bouncy', mushroom: 'Shroomy', chonk: 'Chonk',
          }
          const name = defaultNames[r.bones.species] || 'Buddy'
          saveGlobalConfig({
            ...config,
            companion: {
              name,
              personality: `A ${r.bones.rarity} ${r.bones.species} who loves coding!`,
              hatchedAt: Date.now(),
            },
          })
        } catch (e) {
          logError(e)
        }
      }
    }
  }
}

export default function buddyCommand(): CommandResultDisplay {
  return BuddyInfo()
}
