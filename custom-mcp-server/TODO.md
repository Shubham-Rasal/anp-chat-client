# 🗓️ MCP Knowledge Graph Server TODO

## 🎯 Core Infrastructure

### OrbitDB Setup

- [x] Basic OrbitDB server setup
- [x] Configure IPFS node for OrbitDB
- [x] Set up documents store for graph data
- [x] Implement database connection management
- [x] Add error handling and reconnection logic

### Data Schema Implementation

- [x] Implement Entity interface:
  ```ts
  interface Entity {
    name: string;
    entityType: string;
    observations: string[];
  }
  ```
- [x] Implement Relation interface:
  ```ts
  interface Relation {
    from: string;
    to: string;
    relationType: string;
  }
  ```
- [x] Set up schema validation
- [x] Add indexing for efficient queries

## 🛠️ MCP Tools Implementation

### Entity Management

- [x] create_entitie tool
- [x] get_entitie tool
- [x] delete_entitie tool
- [x] add_observation tool
- [x] delete_observation tool

### Relation Management

- [x] create_relation tool
- [x] delete_relation tool
- [x] Implement bidirectional relation support
- [x] Add relation property support

### Graph Operations

- [x] read_graph tool
- [x] search_node functionality
- [x] open_node implementation
- [x] Implement graph traversal utilities

## 📦 IPFS Integration

### Snapshot Management

- [ ] Implement snapshot_graph tool:
  - [ ] Graph serialization to JSON-LD
  - [ ] IPFS upload functionality
  - [ ] CID generation and management
- [ ] Add pin_snapshot functionality
- [ ] Implement resolve_latest with IPNS

### Provenance Tracking

- [ ] Implement provenance metadata structure:
  ```json
  {
    "timestamp": number,
    "updated_by": string,
    "prev": "CID",
    "current": "CID",
    "change_log": string[]
  }
  ```
- [ ] Add get_provenance tool
- [ ] Implement CID chain tracking
- [ ] Add update history logging

## 🌐 External Knowledge Graph Integration

### Query Adapters

- [x] Wikidata integration (SPARQL + EntityData API)
- [ ] DBpedia connector (SPARQL endpoint)
- [ ] OpenAlex integration (REST API)
- [ ] ConceptNet support (REST API)
- [ ] CommonsenseKG/ATOMIC integration

### Data Pipeline

- [x] Implement query adapter framework
- [x] Create schema transformation layer
- [x] Build import pipeline to OrbitDB
- [x] Add validation for external data

### Integration Tests

- [ ] End-to-end graph update flow
- [ ] External KG import flow
- [ ] CID resolution through IPNS
- [ ] Provenance chain validation

## 📚 Documentation

- [ ] API documentation
- [ ] Setup guide
- [ ] Integration examples
- [ ] External KG connector guide
- [ ] Provenance tracking guide

## 🚀 Deployment

- [ ] Set up CI/CD pipeline
- [ ] Configure production IPFS node
- [ ] Set up monitoring and logging
- [ ] Create deployment guide
- [ ] Add health check endpoints
