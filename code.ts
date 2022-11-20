// import { toRgb, ColorFormat } from 'figx'

// This plugin replaces all selected shapes' text with the previously selected text

/* const RAINBOW: RGB[] = [
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
] */

const STORAGE_KEY = 'sourceTexts'

function isTextNode(node: any): node is TextNode {
  return node.type === 'TEXT'
}

function isShapeWithTextNode(node: SceneNode): node is ShapeWithTextNode {
  return node.type === 'SHAPE_WITH_TEXT'
}

function clone<T>(val: T): T {
  return JSON.parse(JSON.stringify(val))
}

async function sourceText(node: SceneNode) {
  if (!isTextNode(node)) {
    figma.notify("❌ Selected node is not a plain text node")
    return
  }

  const texts = mapSourceTexts(node.characters)

  await figma.clientStorage.setAsync(STORAGE_KEY, texts)

  figma.notify(`✅ Source text ready (${texts.length} blocks)`)
}

function mapSourceTexts(text: string) {
  console.log({ text} )
  return text.split(/[\r\n]+/)
}

async function getSourceTexts() {
  const texts = await figma.clientStorage.getAsync(STORAGE_KEY)

  if (Array.isArray(texts))
    return texts as string[]

  return null
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



  const texts = await getSourceTexts()

  console.log('texts to do:', texts)

  if (!texts) {
    figma.notify("❌ No source text was previously set")
    return
  }

  if (texts.length !== nodes.length) {
    figma.notify(`❌ Different number of texts (${texts.length} set vs ${nodes.length} selected)`)
    return
  }

  nodes.forEach((node, i) => {
    (node as ShapeWithTextNode).text.characters = texts[i]
  })

  figma.viewport.scrollAndZoomIntoView(nodes);
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
