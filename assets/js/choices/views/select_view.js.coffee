define 'choices/views/select_view', [
  'choices/models/list'
  'choices/views/dropdown_view'
  'choices/views/selected_item_view'
], (List, DropdownView, SelectedItemView) ->
  class SelectView extends Backbone.View
    className: "choices"

    initialize: ->
      @list = new List
      @selectedItemView = new SelectedItemView list: @list
      @dropdownView = new DropdownView list: @list, collectionFactory: @options.collectionFactory

    render: =>
      @$el.append @selectedItemView.render().el
      @$el.append @dropdownView.render().el
      this
