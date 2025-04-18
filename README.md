# x-kit-mcp

A tool for fetching news and updates from the X (Twitter) platform for large language models, inspired by [x-kit](https://github.com/xiaoxiunique/x-kit).

## Features

## Installation

1. Clone the repository:
```bash
git clone https://github.com/hasmokan/x-kit-mcp.git
cd x-kit-mcp
```

2. Install dependencies:
```bash
pnpm install
```

## Configuration

1. Edit `config.json` and fill in the required configuration:
```json
{
  "AUTH_TOKEN": "**********",
  "GET_ID_X_TOKEN": "**********",
  "PROXY_URL": "**********",
  "logging": {
    "enableConsoleLog": false,
    "enableFileLog": true
  }
} 
```

2. Edit `mcp.json`
```json
{
  "mcpServers": {
    "x-kit-mcp": {
      "name": "x-kit-mcp",
      "version": "1.0.0",
      "instructions": "You can obtain relevant information about CS2. Please generate an analysis report based on the following e-sports related tweet data, with a focus on aspects such as team roster changes, the progress and results of competitions, and the dynamics of players.",
      "command": "bun",
      "args": [
        "E:\\repo\\x-kit-mcp\\mcp-server.ts"
      ],
      "env":{},
      "disabled": false,
      "autoApprove": false
    }
  }
}
```

## Usage

### Command Line Usage

# Get latest news

```bash
bun run scripts/fetch-tweets.ts  
```

## Important Notes

- Ensure you have valid Twitter API keys
- Comply with Twitter API usage limits and terms
- Set reasonable request frequencies to avoid rate limiting

## License

MIT
