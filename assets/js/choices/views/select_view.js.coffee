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
      @collectionFactory = @options.collectionFactory

    renderSubviews: ->
      @subview new SelectedItemView list: @list, container: @el
      @subview new DropdownView list: @list, collectionFactory: @collectionFactory, container: @el
