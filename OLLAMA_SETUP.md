# Ollama Setup Guide for MilEvalAI v1.6

MilEvalAI v1.6 uses **Ollama** with **llama3.2** for local AI processing. This guide will help you install and configure Ollama.

## Why Ollama?

- ✅ **Runs Locally** - No API costs, full privacy
- ✅ **Fast** - Optimized for local hardware
- ✅ **Open Source** - llama3.2 is free and powerful
- ✅ **No Internet Required** - Once installed, works offline

## Installation

### macOS

```bash
# Install Ollama
curl https://ollama.ai/install.sh | sh

# Or use Homebrew
brew install ollama
```

### Linux

```bash
curl https://ollama.ai/install.sh | sh
```

### Windows

Download from: [https://ollama.ai/download](https://ollama.ai/download)

## Pull llama3.2 Model

After installing Ollama, pull the llama3.2 model:

```bash
ollama pull llama3.2
```

This will download the model (~2-4GB). It may take a few minutes depending on your internet speed.

## Start Ollama Server

```bash
ollama serve
```

This starts the Ollama API server on `http://localhost:11434`.

**Note**: Keep this terminal window open while using MilEvalAI.

## Verify Installation

Test that Ollama is working:

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2",
  "prompt": "Hello, world!",
  "stream": false
}'
```

You should see a JSON response with generated text.

## Environment Variables (Optional)

If Ollama is running on a different port or machine:

```bash
# Add to your .env.local
OLLAMA_API_URL=http://localhost:11434
```

Default is `http://localhost:11434`, so you only need to set this if using a custom setup.

## Using MilEvalAI with Ollama

Once Ollama is running:

1. Start MilEvalAI: `npm run dev`
2. Create a new evaluation
3. Add your bullet points
4. Click "Continue to AI Categorization"
5. AI will automatically process your bullets using Ollama!

## What Ollama Does in MilEvalAI

1. **Bullet Categorization** - Sorts bullets into 6 categories (Character, Presence, Intellect, Leads, Develops, Achieves)
2. **Bullet Enhancement** - Improves grammar, tone, and adds quantification
3. **Rater Comments Generation** - Creates comprehensive rater paragraph
4. **Senior Rater Comments** - Generates strategic-level senior rater comments
5. **Predecessor Analysis** - Learns tone and style from previous evaluations

## Performance

Expected processing times:
- **Single Bullet**: ~2-5 seconds
- **10 Bullets**: ~30-60 seconds
- **Full Evaluation**: ~1-2 minutes

Performance depends on your hardware. Ollama uses:
- **CPU** - Works on any modern CPU
- **GPU** - Automatically uses GPU if available (much faster)
- **Memory** - Requires ~4-8GB RAM

## Troubleshooting

### "Connection refused" error

**Problem**: Ollama server is not running

**Solution**:
```bash
ollama serve
```

Keep this running in a separate terminal.

### "Model not found" error

**Problem**: llama3.2 model not downloaded

**Solution**:
```bash
ollama pull llama3.2
```

### Slow Processing

**Solutions**:
1. **Close other apps** to free up RAM
2. **Use smaller model** (optional):
   ```bash
   ollama pull llama3.2:1b
   ```
3. **Upgrade hardware** - More RAM = faster processing

### API Timeout

**Problem**: Processing takes too long

**Solution**: Increase timeout in code or use a smaller model

## Alternative: Use a Different Model

You can use other Ollama models:

```bash
# List available models
ollama list

# Pull a different model
ollama pull mistral
ollama pull codellama
```

Then update `/lib/ai/ollama.ts`:
```typescript
const MODEL = 'mistral'; // Change from llama3.2
```

## Running Ollama as a Service (Production)

### macOS

Create a LaunchDaemon to auto-start Ollama:

```bash
# Ollama typically installs a service automatically
# Check if running:
brew services list | grep ollama

# Start service:
brew services start ollama
```

### Linux (systemd)

```bash
sudo systemctl enable ollama
sudo systemctl start ollama
```

## Cloud Deployment

For production/Vercel deployment, you have two options:

### Option 1: Use a Remote Ollama Server
1. Deploy Ollama on a dedicated server (AWS, DigitalOcean, etc.)
2. Set `OLLAMA_API_URL` environment variable in Vercel to point to your server

### Option 2: Switch to OpenAI/Anthropic API
For production, you might prefer a hosted API:
- Update `/lib/ai/ollama.ts` to call OpenAI instead
- Add `OPENAI_API_KEY` to environment variables

## FAQ

**Q: Can I use this without Ollama?**
A: No, v1.6 requires Ollama. You could modify the code to use OpenAI or other APIs instead.

**Q: Does it work on M1/M2 Macs?**
A: Yes! Ollama is optimized for Apple Silicon and runs great on M1/M2/M3 Macs.

**Q: How much disk space does it need?**
A: ~4GB for the llama3.2 model.

**Q: Can multiple users use the same Ollama instance?**
A: Yes, Ollama can handle multiple concurrent requests.

**Q: Is my data sent to the internet?**
A: No! Everything runs locally. Your evaluations never leave your machine.

## Resources

- **Ollama Website**: https://ollama.ai
- **Ollama GitHub**: https://github.com/jmorganca/ollama
- **Model Library**: https://ollama.ai/library
- **llama3.2 Info**: https://ollama.ai/library/llama3.2

## Next Steps

1. ✅ Install Ollama
2. ✅ Pull llama3.2 model
3. ✅ Start Ollama server
4. ✅ Run MilEvalAI
5. 🎉 Create AI-powered evaluations!

---

**Need Help?** Check the troubleshooting section or open an issue on GitHub.

