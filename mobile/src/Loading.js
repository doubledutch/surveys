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

import React from 'react'
import { StyleSheet, Text, View, ActivityIndicator } from 'react-native'
import { translate as t } from '@doubledutch/rn-client'

export default () => (
  <View style={s.container}>
    <ActivityIndicator size="large" color={"white"}/>
    <Text style={s.text}>{t("loading")}</Text>
  </View>
)

const s = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#aaa',
  },
  text: {
    color: 'white',
    fontSize: 18,
  },
})
