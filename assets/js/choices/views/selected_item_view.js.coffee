class Choices.SelectedItemView extends Choices.TemplateView
  className: "choices__selected-item"
  template:  "js/choices/templates/selected_item"

  initialize: ->
    @list = @options.list
    @list.on "change:selected", @render
    @list.on "change:isActive", @toggleClickability
    @$el.on "mouseup", @activate

  getTemplateContext: ->
    selected = @list.get("selected")
    if selected? then selected.toJSON() else {}

  toggleClickability: =>
    if @list.get "isActive"
      @$el.off "mouseup", @activate
    else
      @$el.on "mouseup", @activate

  activate: (event) =>
    event.stopPropagation()
    @list.set isActive: true
