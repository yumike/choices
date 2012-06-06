# Simple view to render item in select list, used by Choices.ListView.
class Choices.ItemView extends Choices.TemplateView
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
