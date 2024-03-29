(function() {
  var __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor; child.__super__ = parent.prototype; return child; }, __indexOf = Array.prototype.indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (__hasProp.call(this, i) && this[i] === item) return i; } return -1; }, __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __slice = Array.prototype.slice;

  define('chaplin/application', ['chaplin/mediator', 'chaplin/dispatcher', 'chaplin/views/layout', 'chaplin/lib/router'], function(mediator, Dispatcher, Layout, Router) {
    'use strict';
    var Application;
    return Application = (function() {

      function Application() {}

      Application.prototype.title = '';

      Application.prototype.dispatcher = null;

      Application.prototype.layout = null;

      Application.prototype.router = null;

      Application.prototype.initialize = function() {};

      Application.prototype.initDispatcher = function(options) {
        return this.dispatcher = new Dispatcher(options);
      };

      Application.prototype.initLayout = function(options) {
        var _ref;
        if (options == null) options = {};
        if ((_ref = options.title) == null) options.title = this.title;
        return this.layout = new Layout(options);
      };

      Application.prototype.initRouter = function(routes, options) {
        this.router = new Router(options);
        if (typeof routes === "function") routes(this.router.match);
        return this.router.startHistory();
      };

      Application.prototype.disposed = false;

      Application.prototype.dispose = function() {
        var prop, properties, _i, _len;
        if (this.disposed) return;
        properties = ['dispatcher', 'layout', 'router'];
        for (_i = 0, _len = properties.length; _i < _len; _i++) {
          prop = properties[_i];
          this[prop].dispose();
          delete this[prop];
        }
        this.disposed = true;
        return typeof Object.freeze === "function" ? Object.freeze(this) : void 0;
      };

      return Application;

    })();
  });

  define('chaplin/mediator', ['underscore', 'backbone', 'chaplin/lib/support', 'chaplin/lib/utils'], function(_, Backbone, support, utils) {
    'use strict';
    var mediator;
    mediator = {};
    mediator.subscribe = mediator.on = Backbone.Events.on;
    mediator.unsubscribe = mediator.off = Backbone.Events.off;
    mediator.publish = mediator.trigger = Backbone.Events.trigger;
    mediator._callbacks = null;
    utils.readonly(mediator, 'subscribe', 'unsubscribe', 'publish', 'on', 'off', 'trigger');
    mediator.seal = function() {
      if (support.propertyDescriptors && Object.seal) return Object.seal(mediator);
    };
    utils.readonly(mediator, 'seal');
    return mediator;
  });

  define('chaplin/dispatcher', ['underscore', 'chaplin/mediator', 'chaplin/lib/utils', 'chaplin/lib/subscriber'], function(_, mediator, utils, Subscriber) {
    'use strict';
    var Dispatcher;
    return Dispatcher = (function() {

      _(Dispatcher.prototype).extend(Subscriber);

      Dispatcher.prototype.previousControllerName = null;

      Dispatcher.prototype.currentControllerName = null;

      Dispatcher.prototype.currentController = null;

      Dispatcher.prototype.currentAction = null;

      Dispatcher.prototype.currentParams = null;

      Dispatcher.prototype.url = null;

      function Dispatcher() {
        this.initialize.apply(this, arguments);
      }

      Dispatcher.prototype.initialize = function(options) {
        if (options == null) options = {};
        this.subscribeEvent('matchRoute', this.matchRoute);
        return this.subscribeEvent('!startupController', this.startupController);
      };

      Dispatcher.prototype.matchRoute = function(route, params) {
        return this.startupController(route.controller, route.action, params);
      };

      Dispatcher.prototype.startupController = function(controllerName, action, params) {
        var handler, isSameController;
        if (action == null) action = 'index';
        if (params == null) params = {};
        if (params.changeURL !== false) params.changeURL = true;
        if (params.forceStartup !== true) params.forceStartup = false;
        isSameController = !params.forceStartup && this.currentControllerName === controllerName && this.currentAction === action && (!this.currentParams || _(params).isEqual(this.currentParams));
        if (isSameController) return;
        handler = _(this.controllerLoaded).bind(this, controllerName, action, params);
        return this.loadController(controllerName, handler);
      };

      Dispatcher.prototype.loadController = function(controllerName, handler) {
        var controllerFileName;
        controllerFileName = utils.underscorize(controllerName) + '_controller';
        return require(['controllers/' + controllerFileName], handler);
      };

      Dispatcher.prototype.controllerLoaded = function(controllerName, action, params, ControllerConstructor) {
        var controller, currentController, currentControllerName;
        currentControllerName = this.currentControllerName || null;
        currentController = this.currentController || null;
        if (currentController) {
          mediator.publish('beforeControllerDispose', currentController);
          currentController.dispose(params, controllerName);
        }
        controller = new ControllerConstructor(params, currentControllerName);
        controller[action](params, currentControllerName);
        this.previousControllerName = currentControllerName;
        this.currentControllerName = controllerName;
        this.currentController = controller;
        this.currentAction = action;
        this.currentParams = params;
        this.adjustURL(controller, params);
        return mediator.publish('startupController', {
          previousControllerName: this.previousControllerName,
          controller: this.currentController,
          controllerName: this.currentControllerName,
          params: this.currentParams
        });
      };

      Dispatcher.prototype.adjustURL = function(controller, params) {
        var url;
        if (params.path) {
          url = params.path;
        } else if (typeof controller.historyURL === 'function') {
          url = controller.historyURL(params);
        } else if (typeof controller.historyURL === 'string') {
          url = controller.historyURL;
        } else {
          throw new Error('Dispatcher#adjustURL: controller for ' + ("" + this.currentControllerName + " does not provide a historyURL"));
        }
        if (params.changeURL) mediator.publish('!router:changeURL', url);
        return this.url = url;
      };

      Dispatcher.prototype.disposed = false;

      Dispatcher.prototype.dispose = function() {
        if (this.disposed) return;
        this.unsubscribeAllEvents();
        this.disposed = true;
        return typeof Object.freeze === "function" ? Object.freeze(this) : void 0;
      };

      return Dispatcher;

    })();
  });

  define('chaplin/controllers/controller', ['underscore', 'chaplin/lib/subscriber'], function(_, Subscriber) {
    'use strict';
    var Controller;
    return Controller = (function() {

      _(Controller.prototype).extend(Subscriber);

      Controller.prototype.view = null;

      Controller.prototype.currentId = null;

      function Controller() {
        this.initialize.apply(this, arguments);
      }

      Controller.prototype.initialize = function() {};

      Controller.prototype.disposed = false;

      Controller.prototype.dispose = function() {
        var obj, prop, properties, _i, _len;
        if (this.disposed) return;
        for (prop in this) {
          if (!__hasProp.call(this, prop)) continue;
          obj = this[prop];
          if (obj && typeof obj.dispose === 'function') {
            obj.dispose();
            delete this[prop];
          }
        }
        this.unsubscribeAllEvents();
        properties = ['currentId'];
        for (_i = 0, _len = properties.length; _i < _len; _i++) {
          prop = properties[_i];
          delete this[prop];
        }
        this.disposed = true;
        return typeof Object.freeze === "function" ? Object.freeze(this) : void 0;
      };

      return Controller;

    })();
  });

  define('chaplin/models/collection', ['underscore', 'backbone', 'chaplin/lib/subscriber', 'chaplin/lib/sync_machine', 'chaplin/models/model'], function(_, Backbone, Subscriber, SyncMachine, Model) {
    'use strict';
    var Collection;
    return Collection = (function() {

      __extends(Collection, Backbone.Collection);

      function Collection() {
        Collection.__super__.constructor.apply(this, arguments);
      }

      _(Collection.prototype).extend(Subscriber);

      Collection.prototype.model = Model;

      Collection.prototype.initDeferred = function() {
        return _(this).extend($.Deferred());
      };

      Collection.prototype.initSyncMachine = function() {
        return _(this).extend(SyncMachine);
      };

      Collection.prototype.addAtomic = function(models, options) {
        var direction, model;
        if (options == null) options = {};
        if (!models.length) return;
        options.silent = true;
        direction = typeof options.at === 'number' ? 'pop' : 'shift';
        while (model = models[direction]()) {
          this.add(model, options);
        }
        return this.trigger('reset');
      };

      Collection.prototype.update = function(models, options) {
        var fingerPrint, i, ids, model, newFingerPrint, preexistent, _ids, _len, _results;
        if (options == null) options = {};
        fingerPrint = this.pluck('id').join();
        ids = _(models).pluck('id');
        newFingerPrint = ids.join();
        if (newFingerPrint !== fingerPrint) {
          _ids = _(ids);
          i = this.models.length;
          while (i--) {
            model = this.models[i];
            if (!_ids.include(model.id)) this.remove(model);
          }
        }
        if (newFingerPrint !== fingerPrint || options.deep) {
          _results = [];
          for (i = 0, _len = models.length; i < _len; i++) {
            model = models[i];
            preexistent = this.get(model.id);
            if (preexistent) {
              if (options.deep) {
                _results.push(preexistent.set(model));
              } else {
                _results.push(void 0);
              }
            } else {
              _results.push(this.add(model, {
                at: i
              }));
            }
          }
          return _results;
        }
      };

      Collection.prototype.disposed = false;

      Collection.prototype.dispose = function() {
        var prop, properties, _i, _len;
        if (this.disposed) return;
        this.trigger('dispose', this);
        this.reset([], {
          silent: true
        });
        this.unsubscribeAllEvents();
        this.off();
        if (typeof this.reject === "function") this.reject();
        properties = ['model', 'models', '_byId', '_byCid', '_callbacks'];
        for (_i = 0, _len = properties.length; _i < _len; _i++) {
          prop = properties[_i];
          delete this[prop];
        }
        this.disposed = true;
        return typeof Object.freeze === "function" ? Object.freeze(this) : void 0;
      };

      return Collection;

    })();
  });

  define('chaplin/models/model', ['underscore', 'backbone', 'chaplin/lib/utils', 'chaplin/lib/subscriber', 'chaplin/lib/sync_machine'], function(_, Backbone, utils, Subscriber, SyncMachine) {
    'use strict';
    var Model;
    return Model = (function() {
      var serializeAttributes;

      __extends(Model, Backbone.Model);

      function Model() {
        Model.__super__.constructor.apply(this, arguments);
      }

      _(Model.prototype).extend(Subscriber);

      Model.prototype.initDeferred = function() {
        return _(this).extend($.Deferred());
      };

      Model.prototype.initSyncMachine = function() {
        return _(this).extend(SyncMachine);
      };

      Model.prototype.getAttributes = function() {
        return this.attributes;
      };

      serializeAttributes = function(model, attributes, modelStack) {
        var delegator, key, value;
        if (!modelStack) {
          delegator = utils.beget(attributes);
          modelStack = [model];
        } else {
          modelStack.push(model);
        }
        for (key in attributes) {
          value = attributes[key];
          if (!(value instanceof Model)) continue;
          delegator = delegator || utils.beget(attributes);
          delegator[key] = value === model || __indexOf.call(modelStack, value) >= 0 ? null : serializeAttributes(value, value.getAttributes(), modelStack);
        }
        modelStack.pop();
        return delegator || attributes;
      };

      Model.prototype.serialize = function(model) {
        return serializeAttributes(this, this.getAttributes());
      };

      Model.prototype.disposed = false;

      Model.prototype.dispose = function() {
        var prop, properties, _i, _len;
        if (this.disposed) return;
        this.trigger('dispose', this);
        this.unsubscribeAllEvents();
        this.off();
        if (typeof this.reject === "function") this.reject();
        properties = ['collection', 'attributes', 'changed', '_escapedAttributes', '_previousAttributes', '_silent', '_pending', '_callbacks'];
        for (_i = 0, _len = properties.length; _i < _len; _i++) {
          prop = properties[_i];
          delete this[prop];
        }
        this.disposed = true;
        return typeof Object.freeze === "function" ? Object.freeze(this) : void 0;
      };

      return Model;

    })();
  });

  define('chaplin/views/layout', ['jquery', 'underscore', 'backbone', 'chaplin/mediator', 'chaplin/lib/utils', 'chaplin/lib/subscriber'], function($, _, Backbone, mediator, utils, Subscriber) {
    'use strict';
    var Layout;
    return Layout = (function() {

      _(Layout.prototype).extend(Subscriber);

      Layout.prototype.title = '';

      Layout.prototype.events = {};

      Layout.prototype.el = document;

      Layout.prototype.$el = $(document);

      Layout.prototype.cid = 'chaplin-layout';

      function Layout() {
        this.openLink = __bind(this.openLink, this);        this.initialize.apply(this, arguments);
      }

      Layout.prototype.initialize = function(options) {
        if (options == null) options = {};
        this.title = options.title;
        _(options).defaults({
          loginClasses: true,
          routeLinks: true
        });
        this.subscribeEvent('beforeControllerDispose', this.hideOldView);
        this.subscribeEvent('startupController', this.showNewView);
        this.subscribeEvent('startupController', this.adjustTitle);
        this.delegateEvents();
        if (options.loginClasses) {
          this.subscribeEvent('loginStatus', this.updateLoginClasses);
          this.updateLoginClasses();
        }
        if (options.routeLinks) return this.initLinkRouting();
      };

      Layout.prototype.undelegateEvents = Backbone.View.prototype.undelegateEvents;

      Layout.prototype.delegateEvents = Backbone.View.prototype.delegateEvents;

      Layout.prototype.hideOldView = function(controller) {
        var view;
        scrollTo(0, 0);
        view = controller.view;
        if (view) return view.$el.css('display', 'none');
      };

      Layout.prototype.showNewView = function(context) {
        var view;
        view = context.controller.view;
        if (view) {
          return view.$el.css({
            display: 'block',
            opacity: 1,
            visibility: 'visible'
          });
        }
      };

      Layout.prototype.adjustTitle = function(context) {
        var subtitle, title;
        title = this.title;
        subtitle = context.controller.title;
        if (subtitle) title = "" + subtitle + " \u2013 " + title;
        return setTimeout((function() {
          return document.title = title;
        }), 50);
      };

      Layout.prototype.updateLoginClasses = function(loggedIn) {
        if (loggedIn == null) loggedIn = false;
        return $(document.body).toggleClass('logged-out', !loggedIn).toggleClass('logged-in', loggedIn);
      };

      Layout.prototype.initLinkRouting = function() {
        return $(document).on('click', '.go-to', this.goToHandler).on('click', 'a', this.openLink);
      };

      Layout.prototype.stopLinkRouting = function() {
        return $(document).off('click', '.go-to', this.goToHandler).off('click', 'a', this.openLink);
      };

      Layout.prototype.openLink = function(event) {
        var currentHostname, el, external, href, path;
        if (utils.modifierKeyPressed(event)) return;
        el = event.currentTarget;
        href = el.getAttribute('href');
        if (href === null || href === '' || href.charAt(0) === '#' || $(el).hasClass('noscript')) {
          return;
        }
        currentHostname = location.hostname.replace('.', '\\.');
        external = !RegExp("" + currentHostname + "$", "i").test(el.hostname);
        if (external) return;
        path = el.pathname + el.search;
        if (path.charAt(0) !== '/') path = "/" + path;
        return mediator.publish('!router:route', path, function(routed) {
          if (routed) return event.preventDefault();
        });
      };

      Layout.prototype.goToHandler = function(event) {
        var el, path;
        el = event.currentTarget;
        if (event.nodeName === 'A') return;
        path = $(el).data('href');
        if (!path) return;
        return mediator.publish('!router:route', path, function(routed) {
          if (routed) {
            return event.preventDefault();
          } else {
            return location.href = path;
          }
        });
      };

      Layout.prototype.disposed = false;

      Layout.prototype.dispose = function() {
        if (this.disposed) return;
        this.stopLinkRouting();
        this.unsubscribeAllEvents();
        this.undelegateEvents();
        delete this.title;
        this.disposed = true;
        return typeof Object.freeze === "function" ? Object.freeze(this) : void 0;
      };

      return Layout;

    })();
  });

  define('chaplin/views/view', ['jquery', 'underscore', 'backbone', 'chaplin/lib/utils', 'chaplin/lib/subscriber', 'chaplin/models/model'], function($, _, Backbone, utils, Subscriber, Model) {
    'use strict';
    var View;
    return View = (function() {

      __extends(View, Backbone.View);

      _(View.prototype).extend(Subscriber);

      View.prototype.autoRender = false;

      View.prototype.container = null;

      View.prototype.containerMethod = 'append';

      View.prototype.subviews = null;

      View.prototype.subviewsByName = null;

      View.prototype.wrapMethod = function(name) {
        var func, instance;
        instance = this;
        func = instance[name];
        instance["" + name + "IsWrapped"] = true;
        return instance[name] = function() {
          func.apply(instance, arguments);
          return instance["after" + (utils.upcase(name))].apply(instance, arguments);
        };
      };

      function View() {
        if (this.initialize !== View.prototype.initialize) {
          this.wrapMethod('initialize');
        }
        if (this.render !== View.prototype.render) {
          this.wrapMethod('render');
        } else {
          this.render = _(this.render).bind(this);
        }
        View.__super__.constructor.apply(this, arguments);
      }

      View.prototype.initialize = function(options) {
        var prop, _i, _len, _ref;
        if (options) {
          _ref = ['autoRender', 'container', 'containerMethod'];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            prop = _ref[_i];
            if (options[prop] != null) this[prop] = options[prop];
          }
        }
        this.subviews = [];
        this.subviewsByName = {};
        if (this.model || this.collection) this.modelBind('dispose', this.dispose);
        if (!this.initializeIsWrapped) return this.afterInitialize();
      };

      View.prototype.afterInitialize = function() {
        if (this.autoRender) return this.render();
      };

      View.prototype.delegate = function(eventType, second, third) {
        var handler, selector;
        if (typeof eventType !== 'string') {
          throw new TypeError('View#delegate: first argument must be a string');
        }
        if (arguments.length === 2) {
          handler = second;
        } else if (arguments.length === 3) {
          selector = second;
          if (typeof selector !== 'string') {
            throw new TypeError('View#delegate: ' + 'second argument must be a string');
          }
          handler = third;
        } else {
          throw new TypeError('View#delegate: ' + 'only two or three arguments are allowed');
        }
        if (typeof handler !== 'function') {
          throw new TypeError('View#delegate: ' + 'handler argument must be function');
        }
        eventType += ".delegate" + this.cid;
        handler = _(handler).bind(this);
        if (selector) {
          this.$el.on(eventType, selector, handler);
        } else {
          this.$el.on(eventType, handler);
        }
        return handler;
      };

      View.prototype.undelegate = function() {
        return this.$el.unbind(".delegate" + this.cid);
      };

      View.prototype.modelBind = function(type, handler) {
        var modelOrCollection;
        if (typeof type !== 'string') {
          throw new TypeError('View#modelBind: ' + 'type must be a string');
        }
        if (typeof handler !== 'function') {
          throw new TypeError('View#modelBind: ' + 'handler argument must be function');
        }
        modelOrCollection = this.model || this.collection;
        if (!modelOrCollection) {
          throw new TypeError('View#modelBind: no model or collection set');
        }
        modelOrCollection.off(type, handler, this);
        return modelOrCollection.on(type, handler, this);
      };

      View.prototype.modelUnbind = function(type, handler) {
        var modelOrCollection;
        if (typeof type !== 'string') {
          throw new TypeError('View#modelUnbind: ' + 'type argument must be a string');
        }
        if (typeof handler !== 'function') {
          throw new TypeError('View#modelUnbind: ' + 'handler argument must be a function');
        }
        modelOrCollection = this.model || this.collection;
        if (!modelOrCollection) return;
        return modelOrCollection.off(type, handler);
      };

      View.prototype.modelUnbindAll = function() {
        var modelOrCollection;
        modelOrCollection = this.model || this.collection;
        if (!modelOrCollection) return;
        return modelOrCollection.off(null, null, this);
      };

      View.prototype.pass = function(attribute, selector) {
        var _this = this;
        return this.modelBind("change:" + attribute, function(model, value) {
          var $el;
          $el = _this.$(selector);
          if ($el.is(':input')) {
            return $el.val(value);
          } else {
            return $el.text(value);
          }
        });
      };

      View.prototype.subview = function(name, view) {
        if (name && view) {
          this.removeSubview(name);
          this.subviews.push(view);
          this.subviewsByName[name] = view;
          return view;
        } else if (name) {
          return this.subviewsByName[name];
        }
      };

      View.prototype.removeSubview = function(nameOrView) {
        var index, name, otherName, otherView, view, _ref;
        if (!nameOrView) return;
        if (typeof nameOrView === 'string') {
          name = nameOrView;
          view = this.subviewsByName[name];
        } else {
          view = nameOrView;
          _ref = this.subviewsByName;
          for (otherName in _ref) {
            otherView = _ref[otherName];
            if (view === otherView) {
              name = otherName;
              break;
            }
          }
        }
        if (!(name && view && view.dispose)) return;
        view.dispose();
        index = _(this.subviews).indexOf(view);
        if (index > -1) this.subviews.splice(index, 1);
        return delete this.subviewsByName[name];
      };

      View.prototype.getTemplateData = function() {
        var items, model, modelOrCollection, templateData, _i, _len, _ref;
        if (this.model) {
          templateData = this.model.serialize();
        } else if (this.collection) {
          items = [];
          _ref = this.collection.models;
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            model = _ref[_i];
            items.push(model.serialize());
          }
          templateData = {
            items: items
          };
        } else {
          templateData = {};
        }
        modelOrCollection = this.model || this.collection;
        if (modelOrCollection) {
          if (typeof modelOrCollection.state === 'function' && !('resolved' in templateData)) {
            templateData.resolved = modelOrCollection.state() === 'resolved';
          }
          if (typeof modelOrCollection.isSynced === 'function' && !('synced' in templateData)) {
            templateData.synced = modelOrCollection.isSynced();
          }
        }
        return templateData;
      };

      View.prototype.getTemplateFunction = function() {
        throw new Error('View#getTemplateFunction must be overridden');
      };

      View.prototype.render = function() {
        var html, templateFunc;
        if (this.disposed) return;
        templateFunc = this.getTemplateFunction();
        if (typeof templateFunc === 'function') {
          html = templateFunc(this.getTemplateData());
          this.$el.empty().append(html);
        }
        if (!this.renderIsWrapped) this.afterRender();
        return this;
      };

      View.prototype.afterRender = function() {
        if (this.container) {
          $(this.container)[this.containerMethod](this.el);
          this.trigger('addedToDOM');
        }
        return this;
      };

      View.prototype.disposed = false;

      View.prototype.dispose = function() {
        var prop, properties, subview, _i, _j, _len, _len2, _ref;
        if (this.disposed) return;
        _ref = this.subviews;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          subview = _ref[_i];
          subview.dispose();
        }
        this.unsubscribeAllEvents();
        this.modelUnbindAll();
        this.off();
        this.$el.remove();
        properties = ['el', '$el', 'options', 'model', 'collection', 'subviews', 'subviewsByName', '_callbacks'];
        for (_j = 0, _len2 = properties.length; _j < _len2; _j++) {
          prop = properties[_j];
          delete this[prop];
        }
        this.disposed = true;
        return typeof Object.freeze === "function" ? Object.freeze(this) : void 0;
      };

      return View;

    })();
  });

  define('chaplin/views/collection_view', ['jquery', 'underscore', 'chaplin/views/view'], function($, _, View) {
    'use strict';
    var CollectionView;
    return CollectionView = (function() {

      __extends(CollectionView, View);

      function CollectionView() {
        this.renderAllItems = __bind(this.renderAllItems, this);
        this.showHideFallback = __bind(this.showHideFallback, this);
        this.itemsResetted = __bind(this.itemsResetted, this);
        this.itemRemoved = __bind(this.itemRemoved, this);
        this.itemAdded = __bind(this.itemAdded, this);
        CollectionView.__super__.constructor.apply(this, arguments);
      }

      CollectionView.prototype.animationDuration = 500;

      CollectionView.prototype.listSelector = null;

      CollectionView.prototype.$list = null;

      CollectionView.prototype.fallbackSelector = null;

      CollectionView.prototype.$fallback = null;

      CollectionView.prototype.loadingSelector = null;

      CollectionView.prototype.$loading = null;

      CollectionView.prototype.itemSelector = null;

      CollectionView.prototype.filterer = null;

      CollectionView.prototype.viewsByCid = null;

      CollectionView.prototype.visibleItems = null;

      CollectionView.prototype.getView = function(model) {
        throw new Error('CollectionView#getView must be overridden');
      };

      CollectionView.prototype.getTemplateFunction = function() {};

      CollectionView.prototype.initialize = function(options) {
        if (options == null) options = {};
        CollectionView.__super__.initialize.apply(this, arguments);
        _(options).defaults({
          render: true,
          renderItems: true,
          filterer: null
        });
        this.viewsByCid = {};
        this.visibleItems = [];
        this.addCollectionListeners();
        if (options.filterer) this.filter(options.filterer);
        if (options.render) this.render();
        if (options.renderItems) return this.renderAllItems();
      };

      CollectionView.prototype.addCollectionListeners = function() {
        this.modelBind('add', this.itemAdded);
        this.modelBind('remove', this.itemRemoved);
        return this.modelBind('reset', this.itemsResetted);
      };

      CollectionView.prototype.itemAdded = function(item, collection, options) {
        if (options == null) options = {};
        return this.renderAndInsertItem(item, options.index);
      };

      CollectionView.prototype.itemRemoved = function(item) {
        return this.removeViewForItem(item);
      };

      CollectionView.prototype.itemsResetted = function() {
        return this.renderAllItems();
      };

      CollectionView.prototype.render = function() {
        CollectionView.__super__.render.apply(this, arguments);
        this.$list = this.listSelector ? this.$(this.listSelector) : this.$el;
        this.initFallback();
        return this.initLoadingIndicator();
      };

      CollectionView.prototype.initFallback = function() {
        if (!this.fallbackSelector) return;
        this.$fallback = this.$(this.fallbackSelector);
        this.bind('visibilityChange', this.showHideFallback);
        return this.modelBind('syncStateChange', this.showHideFallback);
      };

      CollectionView.prototype.showHideFallback = function() {
        var visible;
        visible = this.visibleItems.length === 0 && (typeof this.collection.isSynced === 'function' ? this.collection.isSynced() : true);
        return this.$fallback.css('display', visible ? 'block' : 'none');
      };

      CollectionView.prototype.initLoadingIndicator = function() {
        if (!(this.loadingSelector && typeof this.collection.isSyncing === 'function')) {
          return;
        }
        this.$loading = this.$(this.loadingSelector);
        this.modelBind('syncStateChange', this.showHideLoadingIndicator);
        return this.showHideLoadingIndicator();
      };

      CollectionView.prototype.showHideLoadingIndicator = function() {
        var visible;
        visible = this.collection.length === 0 && this.collection.isSyncing();
        return this.$loading.css('display', visible ? 'block' : 'none');
      };

      CollectionView.prototype.filter = function(filterer) {
        var included, index, item, view, _len, _ref;
        this.filterer = filterer;
        if (!_(this.viewsByCid).isEmpty()) {
          _ref = this.collection.models;
          for (index = 0, _len = _ref.length; index < _len; index++) {
            item = _ref[index];
            included = typeof filterer === 'function' ? filterer(item, index) : true;
            view = this.viewsByCid[item.cid];
            if (!view) {
              throw new Error('CollectionView#filter: ' + ("no view found for " + item.cid));
            }
            view.$el.stop(true, true).css('display', included ? '' : 'none');
            this.updateVisibleItems(item, included, false);
          }
        }
        return this.trigger('visibilityChange', this.visibleItems);
      };

      CollectionView.prototype.renderAllItems = function() {
        var cid, index, item, items, remainingViewsByCid, view, _i, _len, _len2, _ref;
        items = this.collection.models;
        this.visibleItems = [];
        remainingViewsByCid = {};
        for (_i = 0, _len = items.length; _i < _len; _i++) {
          item = items[_i];
          view = this.viewsByCid[item.cid];
          if (view) remainingViewsByCid[item.cid] = view;
        }
        _ref = this.viewsByCid;
        for (cid in _ref) {
          if (!__hasProp.call(_ref, cid)) continue;
          view = _ref[cid];
          if (!(cid in remainingViewsByCid)) this.removeView(cid, view);
        }
        for (index = 0, _len2 = items.length; index < _len2; index++) {
          item = items[index];
          view = this.viewsByCid[item.cid];
          if (view) {
            this.insertView(item, view, index, 0);
          } else {
            this.renderAndInsertItem(item, index);
          }
        }
        if (!items.length) {
          return this.trigger('visibilityChange', this.visibleItems);
        }
      };

      CollectionView.prototype.renderAndInsertItem = function(item, index) {
        var view;
        view = this.renderItem(item);
        return this.insertView(item, view, index);
      };

      CollectionView.prototype.renderItem = function(item) {
        var view;
        view = this.viewsByCid[item.cid];
        if (!view) {
          view = this.getView(item);
          this.viewsByCid[item.cid] = view;
        }
        view.render();
        return view;
      };

      CollectionView.prototype.insertView = function(item, view, index, animationDuration) {
        var $list, $next, $previous, $viewEl, children, included, length, position, viewEl;
        if (index == null) index = null;
        if (animationDuration == null) animationDuration = this.animationDuration;
        position = typeof index === 'number' ? index : this.collection.indexOf(item);
        included = typeof this.filterer === 'function' ? this.filterer(item, position) : true;
        viewEl = view.el;
        $viewEl = view.$el;
        if (included) {
          if (animationDuration) $viewEl.addClass('opacity-transitionable');
          if (animationDuration) $viewEl.css('opacity', 0);
        } else {
          $viewEl.css('display', 'none');
        }
        $list = this.$list;
        children = $list.children(this.itemSelector || void 0);
        length = children.length;
        if (length === 0 || position === length) {
          $list.append(viewEl);
        } else {
          if (position === 0) {
            $next = children.eq(position);
            $next.before(viewEl);
          } else {
            $previous = children.eq(position - 1);
            $previous.after(viewEl);
          }
        }
        view.trigger('addedToDOM');
        this.updateVisibleItems(item, included);
        if (animationDuration && included) {
          $viewEl.addClass('opacity-transitionable-end');
          return $viewEl.animate({
            opacity: 1
          }, animationDuration);
        }
      };

      CollectionView.prototype.removeViewForItem = function(item) {
        var view;
        this.updateVisibleItems(item, false);
        view = this.viewsByCid[item.cid];
        return this.removeView(item.cid, view);
      };

      CollectionView.prototype.removeView = function(cid, view) {
        view.dispose();
        return delete this.viewsByCid[cid];
      };

      CollectionView.prototype.updateVisibleItems = function(item, includedInFilter, triggerEvent) {
        var includedInVisibleItems, visibilityChanged, visibleItemsIndex;
        if (triggerEvent == null) triggerEvent = true;
        visibilityChanged = false;
        visibleItemsIndex = _(this.visibleItems).indexOf(item);
        includedInVisibleItems = visibleItemsIndex > -1;
        if (includedInFilter && !includedInVisibleItems) {
          this.visibleItems.push(item);
          visibilityChanged = true;
        } else if (!includedInFilter && includedInVisibleItems) {
          this.visibleItems.splice(visibleItemsIndex, 1);
          visibilityChanged = true;
        }
        if (visibilityChanged && triggerEvent) {
          this.trigger('visibilityChange', this.visibleItems);
        }
        return visibilityChanged;
      };

      CollectionView.prototype.dispose = function() {
        var cid, prop, properties, view, _i, _len, _ref;
        if (this.disposed) return;
        _ref = this.viewsByCid;
        for (cid in _ref) {
          if (!__hasProp.call(_ref, cid)) continue;
          view = _ref[cid];
          view.dispose();
        }
        properties = ['$list', '$fallback', '$loading', 'viewsByCid', 'visibleItems'];
        for (_i = 0, _len = properties.length; _i < _len; _i++) {
          prop = properties[_i];
          delete this[prop];
        }
        return CollectionView.__super__.dispose.apply(this, arguments);
      };

      return CollectionView;

    })();
  });

  define('chaplin/lib/route', ['underscore', 'chaplin/mediator'], function(_, mediator) {
    'use strict';
    var Route;
    return Route = (function() {
      var escapeRegExp, queryStringFieldSeparator, queryStringValueSeparator, reservedParams;

      reservedParams = 'path changeURL'.split(' ');

      escapeRegExp = /[-[\]{}()+?.,\\^$|#\s]/g;

      queryStringFieldSeparator = '&';

      queryStringValueSeparator = '=';

      function Route(pattern, target, options) {
        var _ref;
        this.options = options != null ? options : {};
        this.handler = __bind(this.handler, this);
        this.addParamName = __bind(this.addParamName, this);
        this.pattern = pattern;
        _ref = target.split('#'), this.controller = _ref[0], this.action = _ref[1];
        this.createRegExp();
      }

      Route.prototype.createRegExp = function() {
        var pattern;
        if (_.isRegExp(this.pattern)) {
          this.regExp = this.pattern;
          return;
        }
        pattern = this.pattern.replace(escapeRegExp, '\\$&').replace(/:(\w+)/g, this.addParamName);
        return this.regExp = RegExp("^" + pattern + "(?=\\?|$)");
      };

      Route.prototype.addParamName = function(match, paramName) {
        var _ref;
        if ((_ref = this.paramNames) == null) this.paramNames = [];
        if (_(reservedParams).include(paramName)) {
          throw new Error("Route#addParamName: parameter name " + paramName + " is reserved");
        }
        this.paramNames.push(paramName);
        return '([\\w-]+)';
      };

      Route.prototype.test = function(path) {
        var constraint, constraints, matched, name, params;
        matched = this.regExp.test(path);
        if (!matched) return false;
        constraints = this.options.constraints;
        if (constraints) {
          params = this.extractParams(path);
          for (name in constraints) {
            if (!__hasProp.call(constraints, name)) continue;
            constraint = constraints[name];
            if (!constraint.test(params[name])) return false;
          }
        }
        return true;
      };

      Route.prototype.handler = function(path, options) {
        var params;
        params = this.buildParams(path, options);
        return mediator.publish('matchRoute', this, params);
      };

      Route.prototype.buildParams = function(path, options) {
        var params, patternParams, queryParams;
        params = {};
        queryParams = this.extractQueryParams(path);
        _(params).extend(queryParams);
        patternParams = this.extractParams(path);
        _(params).extend(patternParams);
        _(params).extend(this.options.params);
        params.changeURL = Boolean(options && options.changeURL);
        params.path = path;
        return params;
      };

      Route.prototype.extractParams = function(path) {
        var index, match, matches, paramName, params, _len, _ref;
        params = {};
        matches = this.regExp.exec(path);
        _ref = matches.slice(1);
        for (index = 0, _len = _ref.length; index < _len; index++) {
          match = _ref[index];
          paramName = this.paramNames ? this.paramNames[index] : index;
          params[paramName] = match;
        }
        return params;
      };

      Route.prototype.extractQueryParams = function(path) {
        var current, field, matches, pair, pairs, params, queryString, regExp, value, _i, _len, _ref;
        params = {};
        regExp = /\?(.+?)(?=#|$)/;
        matches = regExp.exec(path);
        if (!matches) return params;
        queryString = matches[1];
        pairs = queryString.split(queryStringFieldSeparator);
        for (_i = 0, _len = pairs.length; _i < _len; _i++) {
          pair = pairs[_i];
          if (!pair.length) continue;
          _ref = pair.split(queryStringValueSeparator), field = _ref[0], value = _ref[1];
          if (!field.length) continue;
          field = decodeURIComponent(field);
          value = decodeURIComponent(value);
          current = params[field];
          if (current) {
            if (current.push) {
              current.push(value);
            } else {
              params[field] = [current, value];
            }
          } else {
            params[field] = value;
          }
        }
        return params;
      };

      return Route;

    })();
  });

  define('chaplin/lib/router', ['underscore', 'backbone', 'chaplin/mediator', 'chaplin/lib/subscriber', 'chaplin/lib/route'], function(_, Backbone, mediator, Subscriber, Route) {
    'use strict';
    var Router;
    return Router = (function() {

      _(Router.prototype).extend(Subscriber);

      function Router(options) {
        this.options = options != null ? options : {};
        this.route = __bind(this.route, this);
        this.match = __bind(this.match, this);
        _(this.options).defaults({
          pushState: true
        });
        this.subscribeEvent('!router:route', this.routeHandler);
        this.subscribeEvent('!router:changeURL', this.changeURLHandler);
        this.createHistory();
      }

      Router.prototype.createHistory = function() {
        return Backbone.history || (Backbone.history = new Backbone.History());
      };

      Router.prototype.startHistory = function() {
        return Backbone.history.start(this.options);
      };

      Router.prototype.stopHistory = function() {
        return Backbone.history.stop();
      };

      Router.prototype.match = function(pattern, target, options) {
        var route;
        if (options == null) options = {};
        route = new Route(pattern, target, options);
        return Backbone.history.route(route, route.handler);
      };

      Router.prototype.route = function(path) {
        var handler, _i, _len, _ref;
        path = path.replace(/^(\/#|\/)/, '');
        _ref = Backbone.history.handlers;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          handler = _ref[_i];
          if (handler.route.test(path)) {
            handler.callback(path, {
              changeURL: true
            });
            return true;
          }
        }
        return false;
      };

      Router.prototype.routeHandler = function(path, callback) {
        var routed;
        routed = this.route(path);
        return typeof callback === "function" ? callback(routed) : void 0;
      };

      Router.prototype.changeURL = function(url) {
        return Backbone.history.navigate(url, {
          trigger: false
        });
      };

      Router.prototype.changeURLHandler = function(url) {
        return this.changeURL(url);
      };

      Router.prototype.disposed = false;

      Router.prototype.dispose = function() {
        if (this.disposed) return;
        this.stopHistory();
        delete Backbone.history;
        this.unsubscribeAllEvents();
        this.disposed = true;
        return typeof Object.freeze === "function" ? Object.freeze(this) : void 0;
      };

      return Router;

    })();
  });

  define('chaplin/lib/subscriber', ['chaplin/mediator'], function(mediator) {
    'use strict';
    var Subscriber;
    Subscriber = {
      subscribeEvent: function(type, handler) {
        if (typeof type !== 'string') {
          throw new TypeError('Subscriber#subscribeEvent: ' + 'type argument must be a string');
        }
        if (typeof handler !== 'function') {
          throw new TypeError('Subscriber#subscribeEvent: ' + 'handler argument must be a function');
        }
        mediator.unsubscribe(type, handler, this);
        return mediator.subscribe(type, handler, this);
      },
      unsubscribeEvent: function(type, handler) {
        if (typeof type !== 'string') {
          throw new TypeError('Subscriber#unsubscribeEvent: ' + 'type argument must be a string');
        }
        if (typeof handler !== 'function') {
          throw new TypeError('Subscriber#unsubscribeEvent: ' + 'handler argument must be a function');
        }
        return mediator.unsubscribe(type, handler);
      },
      unsubscribeAllEvents: function() {
        return mediator.unsubscribe(null, null, this);
      }
    };
    if (typeof Object.freeze === "function") Object.freeze(Subscriber);
    return Subscriber;
  });

  define('chaplin/lib/support', function() {
    'use strict';
    var support;
    support = {
      propertyDescriptors: (function() {
        var o;
        if (!(typeof Object.defineProperty === 'function' && typeof Object.defineProperties === 'function')) {
          return false;
        }
        try {
          o = {};
          Object.defineProperty(o, 'foo', {
            value: 'bar'
          });
          return o.foo === 'bar';
        } catch (error) {
          return false;
        }
      })()
    };
    return support;
  });

  define('chaplin/lib/sync_machine', function() {
    'use strict';
    var STATE_CHANGE, SYNCED, SYNCING, SyncMachine, UNSYNCED, event, _fn, _i, _len, _ref;
    UNSYNCED = 'unsynced';
    SYNCING = 'syncing';
    SYNCED = 'synced';
    STATE_CHANGE = 'syncStateChange';
    SyncMachine = {
      _syncState: UNSYNCED,
      _previousSyncState: null,
      syncState: function() {
        return this._syncState;
      },
      isUnsynced: function() {
        return this._syncState === UNSYNCED;
      },
      isSynced: function() {
        return this._syncState === SYNCED;
      },
      isSyncing: function() {
        return this._syncState === SYNCING;
      },
      unsync: function() {
        var _ref;
        if ((_ref = this._syncState) === SYNCING || _ref === SYNCED) {
          this._previousSync = this._syncState;
          this._syncState = UNSYNCED;
          this.trigger(this._syncState, this, this._syncState);
          this.trigger(STATE_CHANGE, this, this._syncState);
        }
      },
      beginSync: function() {
        var _ref;
        if ((_ref = this._syncState) === UNSYNCED || _ref === SYNCED) {
          this._previousSync = this._syncState;
          this._syncState = SYNCING;
          this.trigger(this._syncState, this, this._syncState);
          this.trigger(STATE_CHANGE, this, this._syncState);
        }
      },
      finishSync: function() {
        if (this._syncState === SYNCING) {
          this._previousSync = this._syncState;
          this._syncState = SYNCED;
          this.trigger(this._syncState, this, this._syncState);
          this.trigger(STATE_CHANGE, this, this._syncState);
        }
      },
      abortSync: function() {
        if (this._syncState === SYNCING) {
          this._syncState = this._previousSync;
          this._previousSync = this._syncState;
          this.trigger(this._syncState, this, this._syncState);
          this.trigger(STATE_CHANGE, this, this._syncState);
        }
      }
    };
    _ref = [UNSYNCED, SYNCING, SYNCED, STATE_CHANGE];
    _fn = function(event) {
      return SyncMachine[event] = function(callback, context) {
        if (context == null) context = this;
        this.on(event, callback, context);
        if (this._syncState === event) return callback.call(context);
      };
    };
    for (_i = 0, _len = _ref.length; _i < _len; _i++) {
      event = _ref[_i];
      _fn(event);
    }
    if (typeof Object.freeze === "function") Object.freeze(SyncMachine);
    return SyncMachine;
  });

  define('chaplin/lib/utils', ['chaplin/lib/support'], function(support) {
    'use strict';
    var utils;
    utils = {
      beget: (function() {
        var ctor;
        if (typeof Object.create === 'function') {
          return Object.create;
        } else {
          ctor = function() {};
          return function(obj) {
            ctor.prototype = obj;
            return new ctor;
          };
        }
      })(),
      readonly: (function() {
        var readonlyDescriptor;
        if (support.propertyDescriptors) {
          readonlyDescriptor = {
            writable: false,
            enumerable: true,
            configurable: false
          };
          return function() {
            var obj, prop, properties, _i, _len;
            obj = arguments[0], properties = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
            for (_i = 0, _len = properties.length; _i < _len; _i++) {
              prop = properties[_i];
              Object.defineProperty(obj, prop, readonlyDescriptor);
            }
            return true;
          };
        } else {
          return function() {
            return false;
          };
        }
      })(),
      upcase: function(str) {
        return str.charAt(0).toUpperCase() + str.substring(1);
      },
      underscorize: function(string) {
        return string.replace(/[A-Z]/g, function(char, index) {
          return (index !== 0 ? '_' : '') + char.toLowerCase();
        });
      },
      modifierKeyPressed: function(event) {
        return event.shiftKey || event.altKey || event.ctrlKey || event.metaKey;
      }
    };
    if (typeof Object.seal === "function") Object.seal(utils);
    return utils;
  });

  define('chaplin', ['chaplin/application', 'chaplin/mediator', 'chaplin/dispatcher', 'chaplin/controllers/controller', 'chaplin/models/collection', 'chaplin/models/model', 'chaplin/views/layout', 'chaplin/views/view', 'chaplin/views/collection_view', 'chaplin/lib/route', 'chaplin/lib/router', 'chaplin/lib/subscriber', 'chaplin/lib/support', 'chaplin/lib/sync_machine', 'chaplin/lib/utils'], function(Application, mediator, Dispatcher, Controller, Collection, Model, Layout, View, CollectionView, Route, Router, Subscriber, support, SyncMachine, utils) {
    return {
      Application: Application,
      mediator: mediator,
      Dispatcher: Dispatcher,
      Controller: Controller,
      Collection: Collection,
      Model: Model,
      Layout: Layout,
      View: View,
      CollectionView: CollectionView,
      Route: Route,
      Router: Router,
      Subscriber: Subscriber,
      support: support,
      SyncMachine: SyncMachine,
      utils: utils
    };
  });

}).call(this);
