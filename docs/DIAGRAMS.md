# Diagrams for soroban-trace

All diagrams use Mermaid syntax for easy rendering in GitHub, Notion, and documentation sites.

---

## 1. Architecture Diagram

Shows the complete system architecture and data flow.

```mermaid
graph LR
    A[User] --> B[CLI Interface]
    B --> C[Library API]
    C --> D[RPC Client]
    D --> E[Soroban RPC]
    D --> F[Horizon API]
    E --> G[Parser]
    F --> G
    G --> H[Formatter]
    H --> I[Output]
    I --> A
    
    style A fill:#e1f5ff
    style B fill:#fff3e0
    style C fill:#fff3e0
    style D fill:#f3e5f5
    style E fill:#e8f5e9
    style F fill:#e8f5e9
    style G fill:#fce4ec
    style H fill:#e0f2f1
    style I fill:#e1f5ff
```

---

## 2. Detailed Component Architecture

Shows internal components and their relationships.

```mermaid
graph TB
    subgraph "User Interface Layer"
        CLI[CLI<br/>cli.ts]
        LIB[Library API<br/>index.ts]
    end
    
    subgraph "Data Fetching Layer"
        RPC[RPC Client<br/>rpc-client.ts]
        SRPC[Soroban RPC]
        HOR[Horizon API]
    end
    
    subgraph "Processing Layer"
        PARSE[Parser<br/>parser.ts]
        XDR[XDR Decoder]
        EVENT[Event Extractor]
        STORE[Storage Analyzer]
    end
    
    subgraph "Output Layer"
        FMT[Formatter<br/>formatter.ts]
        TREE[Tree View]
        JSON[JSON Export]
    end
    
    CLI --> LIB
    LIB --> RPC
    RPC --> SRPC
    RPC --> HOR
    SRPC --> PARSE
    HOR --> PARSE
    PARSE --> XDR
    PARSE --> EVENT
    PARSE --> STORE
    XDR --> FMT
    EVENT --> FMT
    STORE --> FMT
    FMT --> TREE
    FMT --> JSON
    
    style CLI fill:#4CAF50
    style LIB fill:#4CAF50
    style RPC fill:#2196F3
    style PARSE fill:#FF9800
    style FMT fill:#9C27B0
```

---

## 3. User Flow Diagram

Complete user journey from installation to debugging.

```mermaid
graph TD
    START[Developer needs to debug] --> INSTALL[Install soroban-trace]
    INSTALL --> GETHASH{How to get TX hash?}
    
    GETHASH -->|Own contract| DEPLOY[Deploy & invoke contract]
    GETHASH -->|Explorer| EXPLORE[Use Stellar Expert]
    GETHASH -->|Error log| ERROR[From error message]
    
    DEPLOY --> HASH[Copy transaction hash]
    EXPLORE --> HASH
    ERROR --> HASH
    
    HASH --> RUN[Run: soroban-trace tx HASH]
    RUN --> OUTPUT[View formatted output]
    
    OUTPUT --> ANALYZE{Understand result?}
    ANALYZE -->|Yes| FIX[Fix contract code]
    ANALYZE -->|No| VERBOSE[Run with --verbose]
    
    VERBOSE --> DOCS[Check documentation]
    DOCS --> UNDERSTAND[Understand issue]
    UNDERSTAND --> FIX
    
    FIX --> TEST[Test fix]
    TEST --> SUCCESS{Works?}
    SUCCESS -->|Yes| DONE[Done!]
    SUCCESS -->|No| RUN
    
    style START fill:#ffcdd2
    style INSTALL fill:#c8e6c9
    style RUN fill:#90caf9
    style OUTPUT fill:#ce93d8
    style FIX fill:#fff59d
    style DONE fill:#a5d6a7
```

---

## 4. Transaction vs Operation Decision Tree

The crucial concept that soroban-trace clarifies.

```mermaid
graph TD
    START[Transaction Submitted] --> NET{Network accepts?}
    
    NET -->|No| TXFAIL[Transaction: FAILED]
    NET -->|Yes| TXSUC[Transaction: SUCCESS]
    
    TXFAIL --> REASON1[Reasons:<br/>- Insufficient balance<br/>- Bad signature<br/>- Invalid structure]
    REASON1 --> ACTION1[Action:<br/>- Check account balance<br/>- Verify signer<br/>- Review transaction]
    
    TXSUC --> LEDGER[Included in ledger<br/>Fees paid]
    LEDGER --> CONTRACT{Contract executes?}
    
    CONTRACT -->|No| OPFAIL[Operation: FAILED]
    CONTRACT -->|Yes| OPSUC[Operation: SUCCESS]
    
    OPFAIL --> REASON2[Reasons:<br/>- Authorization failed<br/>- Invalid parameters<br/>- Business logic rejected<br/>- Panic/error in code]
    REASON2 --> ACTION2[Action:<br/>- Review contract code<br/>- Check authorization<br/>- Validate inputs<br/>- Add error handling]
    
    OPSUC --> EVENTS[Events emitted<br/>State changed]
    EVENTS --> VERIFY[Verify expected behavior]
    VERIFY --> COMPLETE[Complete!]
    
    style TXFAIL fill:#ffcdd2
    style OPFAIL fill:#ffcdd2
    style TXSUC fill:#c8e6c9
    style OPSUC fill:#c8e6c9
    style COMPLETE fill:#a5d6a7
```

---

## 5. The Four Possible Outcomes

Visual representation of transaction and operation status combinations.

```mermaid
graph TB
    subgraph "Outcome Matrix"
        O1[Transaction: SUCCESS<br/>Operation: SUCCESS<br/><br/>Perfect! Everything worked<br/>Events emitted, state changed]
        O2[Transaction: SUCCESS<br/>Operation: FAILED<br/><br/>Fees paid but contract rejected<br/>No state changes]
        O3[Transaction: FAILED<br/>Operation: N/A<br/><br/>Network rejected<br/>No fees paid]
        O4[Transaction: SUCCESS<br/>Operation: No Events<br/><br/>Silent success<br/>Possible read-only call]
    end
    
    style O1 fill:#a5d6a7
    style O2 fill:#fff59d
    style O3 fill:#ffcdd2
    style O4 fill:#b3e5fc
```

---

## 6. Data Flow Sequence

Shows how data flows through the system.

```mermaid
sequenceDiagram
    participant User
    participant CLI
    participant RPC
    participant Network
    participant Parser
    participant Formatter
    
    User->>CLI: soroban-trace tx HASH
    CLI->>RPC: fetchTransaction(hash)
    RPC->>Network: Query Soroban RPC
    
    alt RPC Success
        Network-->>RPC: Transaction data (XDR)
    else RPC Failed
        RPC->>Network: Fallback to Horizon
        Network-->>RPC: Transaction data
    end
    
    RPC-->>Parser: Raw transaction data
    Parser->>Parser: Decode XDR
    Parser->>Parser: Extract operations
    Parser->>Parser: Parse events
    Parser-->>Formatter: Structured trace
    
    Formatter->>Formatter: Format output
    alt JSON requested
        Formatter-->>CLI: JSON string
    else CLI format
        Formatter-->>CLI: Formatted tree
    end
    
    CLI-->>User: Display result
```

---

## 7. Error Handling Flow

How the tool handles various error scenarios.

```mermaid
graph TD
    START[User runs command] --> VALIDATE{Valid input?}
    
    VALIDATE -->|No| ERR1[Show usage help]
    VALIDATE -->|Yes| FETCH[Fetch transaction]
    
    FETCH --> RPC{RPC available?}
    RPC -->|Yes| GETDATA[Get from RPC]
    RPC -->|No| FALLBACK[Fallback to Horizon]
    
    GETDATA --> FOUND{TX found?}
    FALLBACK --> FOUND
    
    FOUND -->|No| ERR2[Transaction not found]
    FOUND -->|Yes| PARSE[Parse XDR]
    
    PARSE --> VALID{Valid XDR?}
    VALID -->|No| ERR3[Parse error<br/>Show partial data]
    VALID -->|Yes| FORMAT[Format output]
    
    FORMAT --> DISPLAY[Display result]
    
    ERR1 --> END[Exit with error code]
    ERR2 --> END
    ERR3 --> PARTIAL[Show what we could parse]
    PARTIAL --> END
    DISPLAY --> SUCCESS[Exit successfully]
    
    style ERR1 fill:#ffcdd2
    style ERR2 fill:#ffcdd2
    style ERR3 fill:#fff59d
    style SUCCESS fill:#a5d6a7
```

---

## 8. Debugging Workflow

How developers use soroban-trace in their workflow.

```mermaid
graph LR
    A[Write Contract] --> B[Deploy to Testnet]
    B --> C[Invoke Function]
    C --> D{Works?}
    
    D -->|Yes| E[Deploy to Production]
    D -->|No| F[soroban-trace tx HASH]
    
    F --> G[Analyze Output]
    G --> H{Understand issue?}
    
    H -->|Yes| I[Fix Code]
    H -->|No| J[Add Logging/Events]
    
    I --> A
    J --> A
    
    E --> K[Monitor Production]
    K --> L{Issues?}
    L -->|Yes| F
    L -->|No| M[Success!]
    
    style A fill:#e3f2fd
    style F fill:#fff3e0
    style I fill:#f3e5f5
    style M fill:#c8e6c9
```

---

## 9. Component Interaction

Detailed view of how components interact.

```mermaid
graph TB
    subgraph "CLI Layer"
        CMD[Command Parser]
        OPTS[Options Handler]
    end
    
    subgraph "Core Logic"
        TRACE[SorobanTrace Class]
        CONFIG[Configuration]
    end
    
    subgraph "Network Layer"
        RPCCLIENT[RPC Client]
        CACHE[Response Cache]
    end
    
    subgraph "Processing"
        PARSER[Transaction Parser]
        DECODER[XDR Decoder]
        EXTRACTOR[Data Extractor]
    end
    
    subgraph "Output"
        FORMATTER[Trace Formatter]
        COLORIZER[Color Handler]
        JSONWRITER[JSON Writer]
    end
    
    CMD --> OPTS
    OPTS --> TRACE
    CONFIG --> TRACE
    TRACE --> RPCCLIENT
    RPCCLIENT --> CACHE
    CACHE --> PARSER
    PARSER --> DECODER
    DECODER --> EXTRACTOR
    EXTRACTOR --> FORMATTER
    FORMATTER --> COLORIZER
    FORMATTER --> JSONWRITER
    COLORIZER --> OUTPUT[Display]
    JSONWRITER --> OUTPUT
    
    style CMD fill:#4CAF50
    style RPCCLIENT fill:#2196F3
    style PARSER fill:#FF9800
    style FORMATTER fill:#9C27B0
    style OUTPUT fill:#F44336
```

---

## 10. Before vs After Comparison

Visual showing the improvement soroban-trace brings.

```mermaid
graph LR
    subgraph "Before soroban-trace"
        B1[Contract fails] --> B2[Check explorer]
        B2 --> B3[Try to parse XDR]
        B3 --> B4[Still confused]
        B4 --> B5[Trial & error]
        B5 --> B6[20-30 minutes]
    end
    
    subgraph "After soroban-trace"
        A1[Contract fails] --> A2[Run soroban-trace]
        A2 --> A3[See exact issue]
        A3 --> A4[Fix code]
        A4 --> A5[2 seconds]
    end
    
    style B6 fill:#ffcdd2
    style A5 fill:#a5d6a7
```

---

## 11. Network Topology

Shows how the tool connects to different networks.

```mermaid
graph TB
    TOOL[soroban-trace] --> NETWORK{Select Network}
    
    NETWORK -->|testnet| TEST[Testnet RPC]
    NETWORK -->|futurenet| FUTURE[Futurenet RPC]
    NETWORK -->|mainnet| MAIN[Mainnet RPC]
    NETWORK -->|custom| CUSTOM[Custom RPC URL]
    
    TEST --> FALLBACK1[Fallback: Horizon Testnet]
    FUTURE --> FALLBACK2[Fallback: Horizon Futurenet]
    MAIN --> FALLBACK3[Fallback: Horizon Mainnet]
    CUSTOM --> FALLBACK4[Fallback: Specified Horizon]
    
    FALLBACK1 --> DATA[Transaction Data]
    FALLBACK2 --> DATA
    FALLBACK3 --> DATA
    FALLBACK4 --> DATA
    
    style TOOL fill:#4CAF50
    style TEST fill:#64B5F6
    style FUTURE fill:#81C784
    style MAIN fill:#FFB74D
    style CUSTOM fill:#BA68C8
```

---

## 12. Feature Roadmap

Visual roadmap of current and planned features.

```mermaid
graph LR
    subgraph "Phase 1: MVP - COMPLETE"
        P1A[CLI Interface]
        P1B[Transaction Tracing]
        P1C[Event Parsing]
        P1D[JSON Export]
    end
    
    subgraph "Phase 2: Enhanced Parsing"
        P2A[WASM Metadata]
        P2B[Gas Analytics]
        P2C[Function Names]
        P2D[Better Errors]
    end
    
    subgraph "Phase 3: Web UI"
        P3A[Visual Call Graph]
        P3B[Interactive Explorer]
        P3C[Timeline View]
        P3D[REST API]
    end
    
    subgraph "Phase 4: Integration"
        P4A[VSCode Extension]
        P4B[CI/CD Plugin]
        P4C[Live Tracing]
        P4D[Real-time Monitoring]
    end
    
    P1A --> P2A
    P1B --> P2B
    P1C --> P2C
    P1D --> P2D
    P2A --> P3A
    P2B --> P3B
    P2C --> P3C
    P2D --> P3D
    P3A --> P4A
    P3B --> P4B
    P3C --> P4C
    P3D --> P4D
    
    style P1A fill:#a5d6a7
    style P1B fill:#a5d6a7
    style P1C fill:#a5d6a7
    style P1D fill:#a5d6a7
```

---

## Usage in Documentation

### In GitHub README
```markdown
## Architecture

![Architecture](https://mermaid.ink/img/[base64-encoded-diagram])

Or use GitHub's native Mermaid support:
```mermaid
[diagram code]
```
```

### In Notion
1. Add a "Code" block
2. Set language to "Mermaid"
3. Paste the diagram code
4. Notion will render it automatically

### In Documentation Sites
Most modern documentation tools (GitBook, Docusaurus, MkDocs) support Mermaid natively.

---

## Customization

You can customize these diagrams by:
- Changing colors: `style NodeName fill:#hexcolor`
- Adjusting layout: Use `TB` (top-bottom), `LR` (left-right), `RL`, `BT`
- Adding icons: Use emoji in node labels
- Linking nodes: Different arrow types `-->`, `-.->`, `==>`, etc.

---

All diagrams are ready to use in GitHub, Notion, documentation sites, and presentations!

