/*
 * Copyright 2018 DoubleDutch, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *     http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const fs = require('fs')
const path = require('path')

const index = fs.readFileSync(path.join(__dirname, 'build/index.html'), {encoding: 'utf8'})

const cssRegex = /<link href="\/static\/css\/([0-9a-z\.]*\.css)" rel="stylesheet">/g
const jsRegex = /<script src="\/static\/js\/([0-9a-z\.]*\.js)"><\/script>/g

const bundledIndex = index.replace(cssRegex, (match, cssFile) => {
  const css = fs.readFileSync(path.join(__dirname, `build/static/css/${cssFile}`), {encoding: 'utf8'})
  console.log(cssFile)
  return `<style>${css}</style>`
}).replace(jsRegex, (match, jsFile) => {
  const js = fs.readFileSync(path.join(__dirname, `build/static/js/${jsFile}`), {encoding: 'utf8'})
  console.log(jsFile)
  return `<script>${js}</script>`
})

fs.writeFileSync(path.join(__dirname, '../mobile/src/surveyViewHtml.js'), `export default ${JSON.stringify(bundledIndex)};\n`)
