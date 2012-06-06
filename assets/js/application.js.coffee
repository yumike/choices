require [
  'chaplin/models/collection'
  'choices/views/select_view'
], (Collection, SelectView) ->

  class Clients extends Collection
    url: "/clients"

    parse: (response) ->
      response.objects

  clientsFactory = (data, callback) ->
    clients = new Clients
    clients.fetch data: data, success: callback

  jQuery ->
    view = new SelectView collectionFactory: clientsFactory
    $("#application").append view.render().el
