class Choices.SelectView extends Backbone.View
  className: "choices"

  initialize: ->
    @list = new Choices.List
    @selectedItemView = new Choices.SelectedItemView list: @list
    @dropdownView = new Choices.DropdownView list: @list, collectionFactory: @options.collectionFactory

  render: =>
    @$el.append @selectedItemView.render().el
    @$el.append @dropdownView.render().el
    this
