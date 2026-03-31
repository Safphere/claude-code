import type { Command } from '../../commands.js'
import { getGlobalConfig, setGlobalConfig } from '../../utils/config.js'
import { roll, companionUserId } from '../../buddy/companion.js'
import { RARITY_STARS, RARITY_COLORS, SPECIES, type Species } from '../../buddy/types.js'
import { renderSprite } from '../../buddy/sprites.js'

const buddy: Command = {
  type: 'local-jsx',
  name: 'buddy',
  description: 'Your coding companion',
  isEnabled: () => true,
  load: () => import('./buddy.js'),
}

export default buddy
