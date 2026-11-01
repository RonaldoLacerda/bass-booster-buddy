"""Browser DSP regressions. Run: python3 tests/audio-regression.py (preview on port 8080)."""
import asyncio,json
from pathlib import Path
from playwright.async_api import async_playwright

async def main():
 async with async_playwright() as p:
  browser=await p.chromium.launch(headless=True)
  page=await browser.new_page(viewport={"width":1280,"height":1800})
  await page.goto('http://localhost:8080')
  result=await page.evaluate('''async()=>{
    const a=await import('/src/lib/audio-engine.ts');
    const m=await import('/src/lib/mastering.ts');
    const analysis=await import('/src/lib/analysis.ts');
    const make=f=>{const b=new AudioBuffer({length:48000,sampleRate:48000,numberOfChannels:1});const d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=.1*Math.sin(2*Math.PI*f*i/48000);return b};
    const x=make(220),y=make(880);
    const metrics=await analysis.analyzeBuffer(x);
    const first=await m.masterAudio(x,metrics,'youtube','none','same.wav');
    const second=await m.masterAudio(y,await analysis.analyzeBuffer(y),'youtube','none','same.wav');
    const repeated=await m.masterAudio(x,metrics,'youtube','none','same.wav');
    const settings={...a.DEFAULT_SETTINGS,normalize:false};
    const ctx=new OfflineAudioContext(1,48000,48000);const src=ctx.createBufferSource();src.buffer=x;
    const chain=a.buildChain(ctx,settings);a.updateChain(chain,{...settings,compressor:false},ctx);
    src.connect(chain.input);chain.output.connect(ctx.destination);src.start();
    const updated=await ctx.startRendering();const fresh=await a.renderProcessed(x,{...settings,compressor:false});
    const diff=Math.max(...updated.getChannelData(0).map((v,i)=>Math.abs(v-fresh.getChannelData(0)[i])));
    const normalized=await a.renderProcessed(x,{...settings,compressor:false,normalize:true,targetPeak:.95});
    const wav=await a.encodeWav(normalized).arrayBuffer();const header=new DataView(wav);
    const mp3=await a.encodeMp3(normalized,320);
    return {different:first.buffer!==second.buffer,reused:first===repeated,diff,peak:Math.max(...normalized.getChannelData(0).map(Math.abs)),wavChannels:header.getUint16(22,true),wavRate:header.getUint32(24,true),wavSize:wav.byteLength,mp3Size:mp3.size};
  }''')
  assert result['different'], 'Distinct same-name uploads must not share results'
  assert result['reused'], 'Repeat versions of the same source reuse DSP cache'
  assert result['diff'] < 1e-6, 'Disabling compressor must match a fresh export graph'
  assert abs(result['peak']-.95)<1e-6, 'Normalization preserves the selected 0.95 target'
  assert result['wavChannels']==1 and result['wavRate']==48000 and result['wavSize']==96044
  assert result['mp3Size']>1000, 'MP3 encoder must produce audio'
  print('PASS: same-name uploads, cache reuse, compressor bypass, normalization, WAV, MP3',json.dumps(result))
  await browser.close()

asyncio.run(main())
