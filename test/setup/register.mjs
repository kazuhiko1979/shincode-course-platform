// node --import ./test/setup/register.mjs — installs the "@/" alias resolver
// for the test process (zero-dependency; uses node:module customization hooks).
import { register } from 'node:module'

register('./alias-loader.mjs', import.meta.url)
