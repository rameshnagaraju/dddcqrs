eventricStoreSpecs = require 'eventric-store-specs'
InMemoryStore = require './inmemory_store'

describe 'Integration', ->

  beforeEach ->
    InMemoryStore::domainEventSequence.currentDomainEventId = 1


  eventricStoreSpecs.runFor
    StoreClass: InMemoryStore
