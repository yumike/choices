define 'choices/views/view', [
  'chaplin/views/view'
], (ChaplinView) ->

  class View extends ChaplinView

    templateExists: ->
      Handlebars.templates? and @template of Handlebars.templates

    getTemplateFunction: ->
      return unless @template?
      unless @templateExists
        throw new Error "Template '#{@template}' does not exist."
      Handlebars.templates[@template]
