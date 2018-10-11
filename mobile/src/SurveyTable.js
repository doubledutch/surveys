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

'use strict'
import React, { Component } from 'react'
import ReactNative, {
  Platform, TouchableOpacity, Text, TextInput, View, ScrollView, FlatList, Modal, Image
} from 'react-native'
import client, { Avatar, TitleBar, Color } from '@doubledutch/rn-client'

export default class SurveyTable extends Component {
  constructor(props){
    super(props)
    this.state = {
      color: 'white', 
      borderColor: '#EFEFEF',
      search: false,
      survey: '',
      newList: [],
    }
  }


  componentWillReceiveProps(nextProps) {
    if (nextProps.showError !== this.state.isError){
      this.setState({isError: nextProps.showError})
    }
  }

  modalClose() {
    this.setState({anomStatus: false, color: 'white'})
    this.props.hideModal()
  }

  surveySelect = survey => {
    this.props.selectSurvey(survey)
  }

  makeQuestion = (question, anomStatus) => {
    this.props.createSharedTask(question, anomStatus)
    this.setState({question: ''})
  }

  render() {
    const primaryColor = new Color(this.props.primaryColor).limitLightness(0.9).rgbString()
    const newStyle = {
      flex: 1,
      fontSize: 18,
      color: '#364247',
      textAlignVertical: 'top',
      maxHeight: 100,
      height: Math.max(35, this.state.inputHeight),
      paddingTop: 0,
    }
    
    const androidStyle = {
      paddingLeft: 0,
      marginTop: 17,
      marginBottom: 10
    }

    const iosStyle = {
      marginTop: 20,
      marginBottom: 10,
    }
    
    var newColor = "#9B9B9B"
    if (this.props.configKey){
      newColor = primaryColor
    }

    const colorStyle = {
      backgroundColor: newColor
    }
      console.log(this.props.surveys)
      let surveys = this.props.surveys.filter(item => item.isViewable)
      if (this.state.search) { 
        surveys = this.state.newList
      }
      return(
        <View style={{flex: 1, backgroundColor: "#EFEFEF"}}>
          {this.renderModalHeader()}
          {surveys.length ? null : <View style={s.helpTextBox}><Text style={s.helpText}>No Surveys Found</Text></View>}
          <FlatList
          style={{backgroundColor: '#EFEFEF'}}
          data = {surveys}
          ListFooterComponent={<View style={{height: 100}}></View>}
          renderItem={({item}) => (
            <TouchableOpacity onPress={() => this.surveySelect(item)} style={s.listContainer}>
              <View style={s.leftContainer}>
                <SurveyRadio selected={this.props.configKey === item.key} primaryColor={primaryColor} />
              </View>
              <View style={s.rightContainer}>
                <Text style={{fontSize: 16, color: '#364247'}}>{this.returnName(item)}</Text>
              </View>
            </TouchableOpacity>
          )} />
          <View style={{borderTopColor:"#b7b7b7", borderTopWidth: 1, backgroundColor: '#EFEFEF'}}>
            <TouchableOpacity disabled={this.props.disable} onPress={this.props.closeSurveyModal} style={[s.bigButton, colorStyle]}>
              <Text style={{fontSize: 14, textAlign: "center",  color: "white"}}>Take Survey</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) 
  }


  returnName=(item)=> {
    const parsedData = JSON.parse(item.info)
    return parsedData.title
  }



  updateList = (value) => {
    const queryText = value.toLowerCase()
    if (queryText.length > 0){
      var queryResult = [];
      this.props.surveys.forEach(function(content){
        var title = JSON.parse(content.info).title
        if (title) {
          if (title.toLowerCase().indexOf(queryText)!== -1){
            queryResult.push(content);
          }
        }
      });
      this.setState({search: true, newList: queryResult, survey: value})
    }
    else {
      this.setState({search: false, survey: value})
    }
  }
  
  renderModalHeader = () => {
    const newStyle = {
      flex: 1,
      fontSize: 18,
      color: '#364247',
      textAlignVertical: 'top',
      maxHeight: 100,
      height: Math.max(35, this.state.inputHeight),
      paddingTop: 0,
    }
    const androidStyle = {
      paddingLeft: 0,
      marginTop: 5,
    }
    const iosStyle = {
      marginTop: 10,
      marginBottom: 10,
    }
    if (this.props.surveys.length > 0) {
      return ( 
        <View style={{borderBottomColor: "#b7b7b7", borderBottomWidth: 1}}>
          <Text style={s.modHeader}> Please select a survey</Text>
          <View style={{backgroundColor: '#9B9B9B', padding: 10}}>
            <View style={{flexDirection: "row", backgroundColor: "#FFFFFF", borderBottomColor: "#b7b7b7", borderBottomWidth: 1, borderRadius: 5, height: 40}}>
              {this.state.search ? <View style={{width: 40}} /> : <TouchableOpacity style={s.circleBoxMargin}><Text style={s.whiteText}>?</Text></TouchableOpacity>}
              <TextInput style={Platform.select({ios: [newStyle, iosStyle], android: [newStyle, androidStyle]})} placeholder="Search"
                value={this.state.survey}
                onChangeText={survey => this.updateList(survey)} 
                maxLength={25}
                placeholderTextColor="#9B9B9B"
              />
              {this.state.search ? <TouchableOpacity style={s.circleBoxMargin} onPress={this.resetSearch}><Text style={s.whiteText}>X</Text></TouchableOpacity> : null}
            </View>
          </View>
        </View >
      )
    }
    else {
      return (
        <View>
          <View style={{borderBottomColor: "#b7b7b7", borderBottomWidth: 1, marginBottom: 150}}>
            <Text style={s.modHeader}> Please select a survey</Text>
          </View>
            <Text style={{textAlign: "center", fontSize: 20, color: '#9B9B9B', marginBottom: 5}}>No Surveys Available</Text>
        </View>
      )
    }
  }

  resetSearch = () => {
    this.setState({survey: "", search: false})
  }
}

const SurveyRadio = ({selected, primaryColor}) => (
  <View style={[s.radio, selected ? {borderColor: primaryColor} : null]}>
    {selected ? <View style={[s.radioDot, {backgroundColor: primaryColor}]} /> : null}
  </View>
)

const s = ReactNative.StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#EFEFEF',
  },
  buttonContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  helpText: {
    color: '#364247',
    fontSize: 18,
  },
  helpTextBox: {
    flex: 1,
    backgroundColor: "#EFEFEF",
    justifyContent: "flex-end",
    alignItems: "center"
  },
  circleBoxMargin: {
  marginTop:10,
  marginRight: 10,
  marginLeft: 10,
  marginBottom: 20,
  justifyContent: 'center',
  backgroundColor: '#9B9B9B',
  paddingTop: 8,
  paddingBottom: 8,
  paddingLeft: 8,
  paddingRight: 8,
  height: 22,
  borderRadius: 50,
  },

  whiteText: {
    fontSize: 18,
    color: 'white',
  },

  modHeader: {
    backgroundColor: 'white', 
    height: 51, 
    fontSize: 18, 
    textAlign: "center", 
    paddingTop: 15, 
    color: '#364247'
  },
  bottomButtons: {
    flexDirection: 'row',
    backgroundColor: 'white',
    height: 82
  },

  modal: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderWidth: 1,
  },
  modalBottom: {
    flex: 1,
    backgroundColor: 'black',
    opacity: 0.5
  },

  subText:{
    fontSize: 12,
    color: '#9B9B9B'

  },
  nameText:{
    fontSize: 14,
    color: '#9B9B9B',

  },
  bigButton:{
    height: 42, 
    marginTop: 30, 
    marginBottom: 30, 
    marginLeft: 21, 
    marginRight: 21,
    borderRadius: 4,
    borderTopWidth: 1,
    borderTopColor: "#b7b7b7",
    alignItems: "center",
    justifyContent: "center"
  },
  divider: {
    flex: 1
  },
  dividerSm: {
    width: 30
  },
  questionText:{
    fontSize: 16,
    color: '#364247',
    fontFamily: 'System',
  },
  listContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems:'center',
    backgroundColor: 'white',
    marginBottom: 2,
  },
  leftContainer: {
    flexDirection: 'column',
    paddingLeft: 10,
    backgroundColor: 'white',
    alignItems:'center',
    height: '100%',
    paddingTop: 15
  },
  rightContainer: {
    flex: 1,
    width: '80%',
    paddingLeft: 15,
    paddingRight: 20,
    paddingTop: 15,
    paddingBottom: 15,
  },
  anomBox: {
    flex: 1,
    flexDirection: 'row',
  },
  rightBox: {
    flex: 1,
    flexDirection: 'column',
  },
  anomText: {
    flex:1,
    fontSize: 14,
    color: '#364247',
    marginLeft: 5,
    marginTop: 16,
  },
  checkmark: {
    textAlign: 'center',
    height: 16,
    width: 16,
    marginTop: 4
  },
  compose: {
    flexDirection: 'row',
    backgroundColor: 'white',
  },
  composeBox: {
    marginTop: 20,
    flex: 1,
    justifyContent: 'center',
  },
  circleBox: {
    marginTop:20,
    marginRight: 10,
    marginLeft: 10,
    marginBottom: 20,
    justifyContent: 'center',
    backgroundColor: '#9B9B9B',
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 8,
    paddingRight: 8,
    height: 22,
    borderRadius: 50,
  },
  composeText: {
    flex: 1,
    fontSize: 18,
    color: '#9B9B9B',
  },
  radio: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderColor: '#c4c4c4',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  }
})
