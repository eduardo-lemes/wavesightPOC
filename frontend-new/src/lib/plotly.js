// Cached Plotly import — avoids multiple dynamic imports
let _plotly = null
export async function getPlotly() {
  if (!_plotly) _plotly = (await import('plotly.js-dist-min')).default
  return _plotly
}
