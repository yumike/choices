define 'choices/views/item_view', [
  'choices/views/view'
], (View) ->

  # Simple view to render item in select list.
  class ItemView extends View
    tagName:   "li"
    className: "choices__item"
    template:  "js/choices/templates/item"

    initialize: ->
      super
      @list = @options.list
      @$el.hover @enter, @leave
      @$el.click @select

    enter: =>
      @$el.addClass "choices__item_hover"

    leave: =>
      @$el.removeClass "choices__item_hover"

    select: =>
      @list.set selected: @model
