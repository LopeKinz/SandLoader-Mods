
'use strict'

// Gas Pipes for Sandustry / SandLoader.
//
// The vanilla pump transport is water-only. This mod adds a gas-only fast path
// before that code. If no gas is available, the original water path is left
// completely untouched.

const TARGET = 'js/bundle.js'
const captured = Object.create(null)

function remember(groups) {
  if (groups) Object.assign(captured, groups)
}

function unchanged(...args) {
  const groups = args[args.length - 1]
  remember(groups)
  return args[0]
}

module.exports.setup = ({ logger, smln }) => {
  logger.info(`Gas Pipes 1.0.0 loading for Sandustry ${smln.install.version || 'unknown'}`)

  return {
    patches: [
      {
        id: 'gas-pipes:capture-matter-check',
        description: 'Capture Sandustry matter-type checker without depending on its minified identifier',
        find: /(?<isMatter>[\w$]+)\s*=\s*function\s*\((?<elementArg>[\w$]+),\s*(?<matterArg>[\w$]+)\)\s*\{\s*return\s+(?<matterDefs>[\w$]+)\[\k<elementArg>\]\.matterType\s*==\s*\k<matterArg>\s*;?\s*\},/g,
        replace: unchanged,
        expect: 1,
        required: true,
        target: TARGET,
      },
      {
        id: 'gas-pipes:capture-vent-scan',
        description: 'Capture pump, state, grid-size and empty-cell helpers from the authored connectedVents path',
        find: /(?<pump>[\w$]+)\.data\.connectedVents\.map\(function\s*\((?<vent>[\w$]+)\)\s*\{[\s\S]{0,900}?\k<vent>\.y\s*\+\s*(?<grid>[\w$]+)\.snapGridCellSize\s*-\s*1[\s\S]{0,900}?(?<isEmpty>[\w$]+)\((?<state>[\w$]+),\s*[\w$]+,\s*[\w$]+\)\s*&&\s*[\w$]+\+\+/g,
        replace: unchanged,
        expect: 1,
        required: true,
        target: TARGET,
      },
      {
        id: 'gas-pipes:capture-pump-worker-path',
        description: 'Capture element and simulation-worker helpers from the vanilla water pump transfer',
        find: /(?<getType>[\w$]+)\((?<sourceState>[\w$]+),\s*(?<sourceX>[\w$]+),\s*(?<sourceY>[\w$]+)\)\s*===\s*(?<elements>[\w$]+)\.Water[\s\S]{0,900}?\k<sourceState>\.environment\.multithreading\.simulation\.post\(\s*\k<sourceState>,[\s\S]{0,900}?(?<threadUtil>[\w$]+)\.getThreadIndexFromCellX\(\s*\k<sourceX>,[\s\S]{0,900}?\[\s*(?<worker>[\w$]+)\.QueueSetCell,\s*\[\s*\k<sourceX>,\s*\k<sourceY>,\s*(?<cells>[\w$]+)\.Empty,\s*\k<elements>\.Water\s*\]\s*\]/g,
        replace: unchanged,
        expect: 1,
        required: true,
        target: TARGET,
      },
      {
        id: 'gas-pipes:capture-element-constructor',
        description: 'Capture the element constructor from the vanilla pump output path',
        find: /\[\s*(?<outputWorker>[\w$]+)\.QueueSetCell,\s*\[\s*(?<destination>[\w$]+)\.x,\s*\k<destination>\.y,\s*(?<makeElement>[\w$]+)\((?<outputElements>[\w$]+)\.Water,\s*\k<destination>\.x,\s*\k<destination>\.y\)\s*\]\s*\]/g,
        replace: unchanged,
        expect: 1,
        required: true,
        target: TARGET,
      },
      {
        id: 'gas-pipes:transport-gases',
        description: 'Move Gas matter through connected pump/pipe/vent networks before vanilla water transport',
        find: /\(\((?<pumpAtHook>[\w$]+)\.data\.waterBuffer\s*=\s*\k<pumpAtHook>\.data\.waterBuffer\s*\|\|\s*0\),/g,
        replace: (...args) => {
          const full = args[0]
          const groups = args[args.length - 1]
          const p = groups && groups.pumpAtHook

          const required = [
            'isMatter', 'pump', 'grid', 'isEmpty', 'state', 'getType', 'sourceState',
            'elements', 'threadUtil', 'worker', 'cells', 'makeElement',
          ]
          if (!p || required.some((key) => !captured[key])) {
            throw new Error('Gas Pipes could not resolve all runtime identifiers')
          }
          if (captured.pump !== p || captured.state !== captured.sourceState) {
            throw new Error('Gas Pipes pump/state anchors resolved inconsistently')
          }

          const state = captured.state
          const grid = captured.grid
          const isEmpty = captured.isEmpty
          const getType = captured.getType
          const elements = captured.elements
          const isMatter = captured.isMatter
          const threadUtil = captured.threadUtil
          const worker = captured.worker
          const cells = captured.cells
          const makeElement = captured.makeElement

          const gasTransfer = `(function(){` +
            `var O=[],G=[],V,X,Y,T,J,D,Z,P;` +
            `for(V=0;V<${p}.data.connectedVents.length;V++){` +
              `J=${p}.data.connectedVents[V];` +
              `for(Y=J.y+1;Y<J.y+${grid}.snapGridCellSize-1;Y++)` +
                `for(X=J.x+1;X<J.x+${grid}.snapGridCellSize-1;X++)` +
                  `if(${isEmpty}(${state},X,Y))O.push({x:X,y:Y});` +
            `}` +
            `if(!O.length)return false;` +
            `for(Y=${p}.y+1;Y<${p}.y+${grid}.snapGridCellSize-1&&G.length<O.length;Y++){` +
              `for(X=${p}.x+1;X<${p}.x+${grid}.snapGridCellSize-1&&G.length<O.length;X++){` +
                `T=${getType}(${state},X,Y);Z=false;` +
                `if(T!=null&&T!==${elements}.Water){try{Z=${isMatter}(T,4)}catch(_){Z=false}}` +
                `if(Z){` +
                  `G.push(T);` +
                  `${state}.environment.multithreading.simulation.post(` +
                    `${state},${threadUtil}.getThreadIndexFromCellX(X,${state}.environment.multithreading.simulation.threads.length),` +
                    `[${worker}.QueueSetCell,[X,Y,${cells}.Empty,T]]` +
                  `);` +
                `}` +
              `}` +
            `}` +
            `if(!G.length)return false;` +
            `for(V=O.length-1;V>0;V--){P=Math.floor(Math.random()*(V+1));D=O[V];O[V]=O[P];O[P]=D}` +
            `for(V=0;V<G.length;V++){D=O[V];` +
              `${state}.environment.multithreading.simulation.post(` +
                `${state},${threadUtil}.getThreadIndexFromCellX(D.x,${state}.environment.multithreading.simulation.threads.length),` +
                `[${worker}.QueueSetCell,[D.x,D.y,${makeElement}(G[V],D.x,D.y)]]` +
              `);` +
            `}` +
            `return true;` +
          `})()`

          // Keep the original comma-expression shape. The following vanilla
          // capacity scan still runs; the next patch turns its early-exit test
          // true when this gas fast path handled the tick.
          return `((${p}.data.__smlnGasPipesHandled=${gasTransfer}),(${p}.data.waterBuffer=${p}.data.waterBuffer||0),`
        },
        expect: 1,
        required: true,
        target: TARGET,
      },
      {
        id: 'gas-pipes:skip-water-after-gas',
        description: 'Prevent vanilla water transport from writing into the same vent cells after a gas transfer',
        find: /\((?<active>[\w$]+)\s*=\s*(?<pumpAtExit>[\w$]+)\.data\.connectedVents\.filter\(function\s*\((?<ventAtExit>[\w$]+),\s*(?<indexAtExit>[\w$]+)\)\s*\{\s*return\s+(?<counts>[\w$]+)\[\k<indexAtExit>\]\s*>\s*0\s*;?\s*\}\)\s*\)\s*,\s*\k<counts>\.filter\(function\s*\((?<count>[\w$]+)\)\s*\{\s*return\s+\k<count>\s*>\s*0\s*;?\s*\}\)\s*,\s*0\s*===\s*\k<active>\.length/g,
        replace: (...args) => {
          const groups = args[args.length - 1]
          const { active, pumpAtExit, ventAtExit, indexAtExit, counts, count } = groups
          return `(${active}=${pumpAtExit}.data.connectedVents.filter(function(${ventAtExit},${indexAtExit}){return ${counts}[${indexAtExit}]>0;})),` +
            `${counts}.filter(function(${count}){return ${count}>0;}),` +
            `(${pumpAtExit}.data.__smlnGasPipesHandled||0===${active}.length)`
        },
        expect: 1,
        required: true,
        target: TARGET,
      },
    ],
  }
}
