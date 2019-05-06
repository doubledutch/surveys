import React, { Component } from 'react'
import { translate as t } from '@doubledutch/admin-client'
import * as SurveyJSCreator from 'survey-creator'
import * as SurveyKo from 'survey-knockout'
import 'surveyjs-editor/surveyeditor.css'
import 'jquery-ui/themes/base/all.css'
import 'select2/dist/css/select2.css'
import 'bootstrap-slider/dist/css/bootstrap-slider.css'
import 'jquery-bar-rating/dist/themes/css-stars.css'
import 'jquery-bar-rating/dist/themes/fontawesome-stars.css'
import $ from 'jquery'
import 'jquery-ui/ui/widgets/datepicker.js'
import 'select2/dist/js/select2.js'
import 'jquery-bar-rating'

import 'icheck/skins/square/blue.css'

import * as widgets from 'surveyjs-widgets'
import DateTimePicker from '@doubledutch/react-components/lib/DateTimePicker'
import CheckIcon from './CheckIcon'

widgets.icheck(SurveyKo, $)
widgets.jquerybarrating(SurveyKo, $)
widgets.jqueryuidatepicker(SurveyKo, $)
widgets.bootstrapslider(SurveyKo)

class SurveyEditor extends Component {
  constructor(props) {
    super(props)
    this.state = {
      allowAnom: false,
      showControls: false,
      localConfig: this.props.config || '',
      currentTime: null,
      disable: false,
    }
    const mainColor = '#73aaf3'
    const mainHoverColor = '#73aaf3'
    const textColor = '#4a4a4a'

    const defaultThemeColorsEditor = SurveyJSCreator.StylesManager.ThemeColors.default
    defaultThemeColorsEditor['$primary-color'] = mainColor
    defaultThemeColorsEditor['$secondary-color'] = mainColor
    defaultThemeColorsEditor['$primary-hover-color'] = mainHoverColor
    defaultThemeColorsEditor['$primary-text-color'] = textColor
    defaultThemeColorsEditor['$secondary-border-color'] = mainColor
    defaultThemeColorsEditor['$selection-border-color'] = mainColor
    SurveyJSCreator.StylesManager.applyTheme()
  }

  componentDidMount() {
    this.setState({
      allowAnom: this.props.allowAnom || false,
      currentTime: this.props.publishDate || new Date(),
    })
    const editorOptions = {
      showEmbededSurveyTab: false,
      showPropertyGrid: this.state.showControls,
      showPagesToolbox: true,
      useTabsInElementEditor: true,
      showJSONEditorTab: true,
      questionTypes: [
        'text',
        'checkbox',
        'radiogroup',
        'dropdown',
        'boolean',
        'matrix',
        'matrixdynamic',
        'imagepicker',
        'comment',
        'expression',
        'multipletext',
      ],
    }

    this.editor = new SurveyJSCreator.SurveyCreator('surveyCreatorContainer', editorOptions)
    this.editor.onShowingProperty.add(function(sender, options) {
      if (options.obj.getType() !== 'page') {
        options.canShow = options.property.name !== 'name'
      }
    })
    this.editor.haveCommercialLicense = true
    this.editor.isAutoSave = true
    this.editor.saveSurveyFunc = this.saveMySurvey
    this.editor.text = this.state.localConfig
  }

  componentDidUpdate(nextProps, nextState) {
    if (this.state.showControls !== nextState.showControls) {
      const editorOptions = {
        showEmbededSurveyTab: false,
        showPropertyGrid: this.state.showControls,
        showPagesToolbox: true,
        useTabsInElementEditor: true,
        showJSONEditorTab: true,
        questionTypes: [
          'text',
          'checkbox',
          'radiogroup',
          'dropdown',
          'boolean',
          'matrix',
          'matrixdynamic',
          'imagepicker',
          'comment',
          'expression',
          'multipletext',
        ],
      }
      this.editor = new SurveyJSCreator.SurveyCreator('surveyCreatorContainer', editorOptions)
      this.editor.onShowingProperty.add(function(sender, options) {
        if (options.obj.getType() !== 'page') {
          options.canShow = options.property.name !== 'name'
        }
      })
      this.editor.haveCommercialLicense = true
      this.editor.isAutoSave = true
      this.editor.saveSurveyFunc = this.saveMySurvey
      this.editor.text = this.state.localConfig
    }
    if (this.props.publishDate !== nextProps.publishDate) {
      this.setState({ currentTime: nextProps.publishDate })
    }
  }

  render() {
    const publishedVersion = this.props.surveys.find(survey => survey.key === this.props.configKey)
    const publishedTime = publishedVersion ? new Date(publishedVersion.lastUpdate) : undefined
    return (
      <div className="tableContainer">
        <div className="headerRow">
          <h2 className="boxTitle">{t('editor')}</h2>
          {publishedTime ? (
            <p className="publishedTime">
              {t('last_published', { time: publishedTime.toLocaleString() })}
            </p>
          ) : null}
          <div className="flex" />
          <button
            className="deleteButton"
            onClick={() => this.props.deleteSurvey(this.props.history)}
          >
            {t('delete')}
          </button>
          <button className="dd-bordered" onClick={this.showHomePage} disabled={this.state.disable}>
            {t('done')}
          </button>
        </div>
        <div className="editorBox">
          {this.props.isEditorBoxDisplay && <div id="surveyCreatorContainer" />}
        </div>
        <div className="settingsContainer">
          <div className="settingsSubContainer">
            <p className="boxTitleBold">{t('allow_anom')}</p>
            <CheckIcon
              allowAnom={this.state.allowAnom}
              offApprove={this.reSaveOff}
              onApprove={this.reSaveOn}
            />
            <p className="boxTitleBold">{t('allow_controls')}</p>
            <CheckIcon
              allowAnom={this.state.showControls}
              offApprove={this.controlsOff}
              onApprove={this.controlsOn}
            />
          </div>
          {this.state.currentTime && (
            <div>
              <p className="boxTitleBold">{t('publish_time')}</p>
              <DateTimePicker
                value={this.state.currentTime}
                onChange={this.handleNewDate}
                timeZone={this.props.eventData.timeZone}
              />
            </div>
          )}
        </div>
      </div>
    )
  }

  controlsOn = () => {
    const showControls = true
    if (showControls !== this.state.showControls) {
      this.setState({ showControls, localConfig: this.editor.text })
    }
  }

  showHomePage = () => {
    this.setState({ disable: true })
    this.props.showHomePage(this.props.history)
  }

  controlsOff = () => {
    const showControls = false
    if (showControls !== this.state.showControls) {
      this.setState({ showControls, localConfig: this.editor.text })
    }
  }

  handleNewDate = date => {
    this.setState({ currentTime: date })
    this.props.saveConfig(this.editor.text, true, date)
  }

  reSaveOn = () => {
    const allowAnom = true
    if (allowAnom !== this.state.allowAnom) {
      this.setState({ allowAnom })
      this.props.saveConfig(this.editor.text, true, this.state.currentTime)
    }
  }

  reSaveOff = () => {
    const allowAnom = false
    if (allowAnom !== this.state.allowAnom) {
      this.setState({ allowAnom })
      this.props.saveConfig(this.editor.text, false, this.state.currentTime)
    }
  }

  saveMySurvey = () => {
    const { allowAnom } = this.state
    this.props.saveConfig(this.editor.text, allowAnom, this.state.currentTime)
  }
}

export default SurveyEditor
