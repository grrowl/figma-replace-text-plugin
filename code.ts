// import { toRgb, ColorFormat } from 'figx'

// This plugin replaces all selected shapes' text with the previously selected text

// const RAINBOW: RGBA[] = ["#817", "#a35", "#c66", "#e94", "#ed0", "#9d5", "#4d8", "#2cb", "#0bc", "#09c", "#36b", "#639"].map(hex => toRgb(hex, ColorFormat.OBJECT) as any as RGBA)

/* const RAINBOW: RGBA[] = [
  { r:136, g:17, b:119, a:255 },
  { r:170, g:51, b:85, a:255 },
  { r:204, g:102, b:102, a:255 },
  { r:238, g:153, b:68, a:255 },
  { r:238, g:221, b:0, a:255 },
  { r:153, g:221, b:85, a:255 },
  { r:68, g:221, b:136, a:255 },
  { r:34, g:204, b:187, a:255 },
  { r:0, g:187, b:204, a:255 },
  { r:0, g:153, b:204, a:255 },
  { r:51, g:102, b:187, a:255 },
  { r:102, g:51, b:153, a:255 }
] */

const RAINBOW: RGB[] = [
  { r: 0.5333333333333333, g: 0.06666666666666667, b: 0.4666666666666667 },
  { r: 0.6666666666666666, g: 0.2, b: 0.3333333333333333 },
  { r: 0.8, g: 0.4, b: 0.4 },
  { r: 0.9333333333333333, g: 0.6, b: 0.26666666666666666 },
  { r: 0.9333333333333333, g: 0.8666666666666667, b:0 },
  { r: 0.6, g: 0.8666666666666667, b: 0.3333333333333333 },
  { r: 0.26666666666666666, g: 0.8666666666666667, b: 0.5333333333333333 },
  { r: 0.13333333333333333, g: 0.8, b: 0.7333333333333333 },
  { r: 0, g: 0.7333333333333333, b: 0.8 },
  { r: 0, g: 0.6, b: 0.8 },
  { r: 0.2, g: 0.4, b: 0.7333333333333333 },
  { r: 0.4, g: 0.2, b: 0.6 },
]

// or, <link rel="stylesheet" href="https://unpkg.com/xp.css@/dist/98.css" >
const PROMPT_HTML = `
<link rel="stylesheet" href="https://unpkg.com/xp.css">
<div class="window" style="width: 300px">
  <div class="title-bar">
    <div class="title-bar-text">BulletText</div>
    <div class="title-bar-controls">
      <button aria-label="Close"></button>
    </div>
  </div>
  <div class="window-body">
    <div class="field-row-stacked" style="width: 240px">
      <label for="input_text">Paste text here</label>
      <textarea id="input_text" rows="8"></textarea>
    </div>
    <section class="field-row" style="justify-content: flex-end">
      <button>OK</button>
      <button>Cancel</button>
    </section>
  </div>
</div>
`

function isTextNode(node: any): node is TextNode {
  return node.type === 'TEXT'
}

function isShapeWithTextNode(node: SceneNode): node is ShapeWithTextNode {
  return node.type === 'SHAPE_WITH_TEXT'
}

function clone<T>(val: T): T {
  return JSON.parse(JSON.stringify(val))
}

let sourceTextNode: TextNode | null = null

async function sourceText(node: SceneNode) {
  if (!isTextNode(node)) {
    figma.notify("❌ Selected node is not a plain text node")
    return
  }

  if (sourceTextNode) {
    // unset the existing one
    sourceTextNode.opacity = 1
  }

  node.opacity = 0.76

  node.strokes = [{
    type: 'SOLID',
    color: RAINBOW[RAINBOW.length -1]
  }]

  // set the new one
  sourceTextNode = node

  figma.notify("✅ Source text ready")
}
function getSourceTexts() {
  if (!sourceTextNode || sourceTextNode.removed) {
    return null
  }
  return sourceTextNode.characters.split(/\r\n+/)
}

async function replaceText(selection: readonly SceneNode[]) {
  const nodes: ShapeWithTextNode[] = selection.filter(isShapeWithTextNode)

  if (nodes.length <= 1) {
    figma.notify("❌ Selected nodes aren't ShapeWithText")
    return
  }

  // ensure fonts are loaded (so we can update text)
  // await figma.loadFontAsync({ family: "Inter", style: "Medium" })
  for (const node of nodes) {
    const fontNames = node.text.getRangeAllFontNames(0, node.text.characters.length)
    for (const fontName of fontNames) {
      await figma.loadFontAsync(fontName)
    }
  }

  figma.showUI(
    PROMPT_HTML,
    { width: 300, height: 200, title: "Bullet Text" }
  )

  const texts = getSourceTexts()

  console.log('texts to do:', texts)

  if (!texts) {
    figma.notify("❌ No source text node was found")
    return
  }

  nodes.forEach((node, i) => {
    (node as ShapeWithTextNode).text.characters = texts[i]
  })

  figma.viewport.scrollAndZoomIntoView(nodes);

  // Make sure to close the plugin when you're done. Otherwise the plugin will
  // keep running, which shows the cancel button at the bottom of the screen.
  figma.closePlugin();
}


;(async function run() {
  const selection = figma.currentPage.selection

  if (selection.length === 1) {
    await sourceText(selection[0])

  } else if (selection.length > 1) {
    await replaceText(selection)
  } else {
    figma.notify("⁉️ Select 1 text node or multiple target nodes to use")
  }


  // Make sure to close the plugin when you're done. Otherwise the plugin will
  // keep running, which shows the cancel button at the bottom of the screen.
  figma.closePlugin();
})()
