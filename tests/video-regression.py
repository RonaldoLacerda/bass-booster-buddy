import asyncio,json,base64,subprocess,tempfile
from pathlib import Path

TMP = Path(tempfile.mkdtemp(prefix="audiomix-video-"))
subprocess.run(["ffmpeg","-y","-f","lavfi","-i","testsrc2=size=320x240:rate=30:duration=3","-f","lavfi","-i","sine=frequency=440:duration=3","-c:v","libvpx","-c:a","libopus","-shortest",str(TMP / "input.webm"),"-loglevel","error"],check=True)
from playwright.async_api import async_playwright
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(headless=True)
  page=await b.new_page(viewport={"width":1280,"height":1800});await page.goto('http://localhost:8080')
  data=base64.b64encode(open(TMP / 'input.webm','rb').read()).decode()
  result=await page.evaluate('''async(data)=>{
   const {exportVideoWithAudio}=await import('/src/lib/video-export.ts');
   const bytes=Uint8Array.from(atob(data),x=>x.charCodeAt(0));const url=URL.createObjectURL(new Blob([bytes],{type:'video/webm'}));
   const audio=new AudioBuffer({length:144000,numberOfChannels:1,sampleRate:48000});const d=audio.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=.2*Math.sin(2*Math.PI*880*i/48000);
   const contexts=[],tracks=[];const Original=window.AudioContext;window.AudioContext=class extends Original{constructor(...args){super(...args);contexts.push(this)} createMediaStreamDestination(){const d=super.createMediaStreamDestination();tracks.push(...d.stream.getTracks());return d}};
   const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=async function(){await new Promise(r=>setTimeout(r,500));return play.call(this)};
   try {const progress=[];const blob=await exportVideoWithAudio(url,audio,v=>progress.push(v));const arr=new Uint8Array(await blob.arrayBuffer());let s='';for(let i=0;i<arr.length;i+=8192)s+=String.fromCharCode(...arr.subarray(i,i+8192));return {bytes:btoa(s),progress:progress.at(-1),closed:contexts.every(c=>c.state==='closed'),ended:tracks.every(t=>t.readyState==='ended')};}
   finally{window.AudioContext=Original;HTMLMediaElement.prototype.play=play;URL.revokeObjectURL(url)}
  }''',data)
  open(TMP / 'output.webm','wb').write(base64.b64decode(result.pop('bytes')));assert result=={'progress':100,'closed':True,'ended':True},result
  print('VIDEO',json.dumps(result))
  failure=await page.evaluate('''async(data)=>{const {exportVideoWithAudio}=await import('/src/lib/video-export.ts');const bytes=Uint8Array.from(atob(data),x=>x.charCodeAt(0));const url=URL.createObjectURL(new Blob([bytes],{type:'video/webm'}));const contexts=[];const Original=window.AudioContext;window.AudioContext=class extends Original{constructor(...a){super(...a);contexts.push(this)}};const Recorder=window.MediaRecorder;window.MediaRecorder=class{static isTypeSupported(){return true}constructor(){throw Error('forced')}};try{await exportVideoWithAudio(url,new AudioBuffer({length:144000,sampleRate:48000,numberOfChannels:1}));return {rejected:false}}catch{return {rejected:true,closed:contexts.every(c=>c.state==='closed')}}finally{window.AudioContext=Original;window.MediaRecorder=Recorder;URL.revokeObjectURL(url)}}''',data)
  assert failure=={'rejected':True,'closed':True},failure;print('FAILURE_CLEANUP',failure)
  subprocess.run(["ffmpeg","-y","-i",str(TMP / "output.webm"),str(TMP / "audio.wav"),"-loglevel","fatal"],check=True)
  import wave,numpy as np
  with wave.open(str(TMP / "audio.wav")) as w:
   rate=w.getframerate(); samples=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).reshape(-1,w.getnchannels())[:,0].astype(float)
  frequency=np.fft.rfftfreq(len(samples),1/rate)[np.argmax(abs(np.fft.rfft(samples)))]; duration=len(samples)/rate
  assert abs(frequency-880)<3, "Video must use processed 880 Hz audio, not original 440 Hz"
  assert 2.7<duration<3.3, "Delayed video playback must preserve the three-second output"
  print('PASS: delayed video export, processed audio, duration and failure cleanup')
  await b.close()
asyncio.run(main())
