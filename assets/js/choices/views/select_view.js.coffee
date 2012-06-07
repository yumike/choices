define 'choices/views/select_view', [
  'choices/models/list'
  'choices/views/view'
  'choices/views/dropdown_view'
  'choices/views/selected_item_view'
], (List, View, DropdownView, SelectedItemView) ->

  class SelectView extends View
    className: "choices"

    initialize: ->
      super
      @list = new List
      @selectedItemView = new SelectedItemView list: @list
      @dropdownView = new DropdownView list: @list, collectionFactory: @options.collectionFactory

    render: ->
      super
      @$el.append @selectedItemView.render().el
      @$el.append @dropdownView.render().el
      this
