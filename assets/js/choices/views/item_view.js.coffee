define 'choices/views/item_view', [
  'choices/views/template_view'
], (TemplateView) ->

  # Simple view to render item in select list.
  class ItemView extends TemplateView
    tagName:   "li"
    className: "choices__item"
    template:  "js/choices/templates/item"

    initialize: ->
      @list = @options.list
      @$el.hover @enter, @leave
      @$el.click @select

    getTemplateContext: ->
      @model.toJSON()

    enter: =>
      @$el.addClass "choices__item_hover"

    leave: =>
      @$el.removeClass "choices__item_hover"

    select: =>
      @list.set selected: @model
