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

const cssRegex = /<link href="\/static\/css\/(main\..*\.css)" rel="stylesheet">/
const jsRegex = /<script type="text\/javascript" src="\/static\/js\/(main\..*\.js)"><\/script>/

const cssFile = index.match(cssRegex)[1]
const jsFile = index.match(jsRegex)[1]

const css = fs.readFileSync(path.join(__dirname, `build/static/css/${cssFile}`))
const js = fs.readFileSync(path.join(__dirname, `build/static/js/${jsFile}`))

const cssTag = `<style>${css}</style>`
const jsTag = `<script type="text/javascript">${js}</script>`

const bundledIndex = index
  .replace(cssRegex, cssTag)
  .replace(jsRegex, jsTag)

fs.writeFileSync(path.join(__dirname, '../mobile/src/surveyViewHtml.js'), `export default ${JSON.stringify(bundledIndex)};\n`)
