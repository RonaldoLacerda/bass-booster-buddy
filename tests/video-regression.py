import asyncio,json,base64,subprocess,tempfile,sys
from pathlib import Path

MP4 = "--mp4" in sys.argv
EXT = "mp4" if MP4 else "webm"
TMP = Path(tempfile.mkdtemp(prefix="audiomix-video-"))
subprocess.run(["ffmpeg","-y","-f","lavfi","-i","testsrc2=size=320x240:rate=30:duration=3","-f","lavfi","-i","sine=frequency=440:duration=3","-c:v","libx264" if MP4 else "libvpx","-c:a","aac" if MP4 else "libopus","-shortest",str(TMP / f"input.{EXT}"),"-loglevel","error"],check=True)
from playwright.async_api import async_playwright
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(headless=True)
  page=await b.new_page(viewport={"width":1280,"height":1800});await page.goto('http://localhost:8080')
  data=base64.b64encode(open(TMP / f'input.{EXT}','rb').read()).decode()
  result=await page.evaluate('''async(data)=>{
   const {exportVideoWithAudio}=await import('/src/lib/video-export.ts');
   const bytes=Uint8Array.from(atob(data),x=>x.charCodeAt(0));const url=URL.createObjectURL(new Blob([bytes],{type:'video/webm'}));
   const audio=new AudioBuffer({length:144000,numberOfChannels:1,sampleRate:48000});const d=audio.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=.2*Math.sin(2*Math.PI*880*i/48000);
   
   const play=HTMLMediaElement.prototype.play;HTMLMediaElement.prototype.play=async function(){await new Promise(r=>setTimeout(r,500));return play.call(this)};
   try {const progress=[];const blob=await exportVideoWithAudio(url,audio,v=>progress.push(v));const arr=new Uint8Array(await blob.arrayBuffer());let s='';for(let i=0;i<arr.length;i+=8192)s+=String.fromCharCode(...arr.subarray(i,i+8192));return {bytes:btoa(s),progress:progress.at(-1),mime:blob.type};}
   finally{HTMLMediaElement.prototype.play=play;URL.revokeObjectURL(url)}
  }''',data)
  open(TMP / f'output.{EXT}','wb').write(base64.b64decode(result.pop('bytes')));assert result=={'progress':100,'mime':'video/mp4' if MP4 else 'video/webm'},result
  print('VIDEO',json.dumps(result))
  failure=await page.evaluate('''async()=>{const {exportVideoWithAudio}=await import('/src/lib/video-export.ts');const url=URL.createObjectURL(new Blob(['invalid'],{type:'video/webm'}));try{await exportVideoWithAudio(url,new AudioBuffer({length:144000,sampleRate:48000,numberOfChannels:1}));return false}catch{return true}finally{URL.revokeObjectURL(url)}}''')
  assert failure, 'Unreadable input must reject instead of downloading a damaged file'
  def frame_hashes(path):
   result=subprocess.run(["ffmpeg","-i",str(path),"-map","0:v:0","-f","framemd5","-"],capture_output=True,text=True,check=True)
   return [line.split(',')[-1].strip() for line in result.stdout.splitlines() if not line.startswith('#')]
  assert frame_hashes(TMP / f'input.{EXT}') == frame_hashes(TMP / f'output.{EXT}'), 'Every decoded video frame must remain identical'
  subprocess.run(["ffmpeg","-y","-i",str(TMP / f"output.{EXT}"),str(TMP / "audio.wav"),"-loglevel","fatal"],check=True)
  import wave,numpy as np
  with wave.open(str(TMP / "audio.wav")) as w:
   rate=w.getframerate(); samples=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).reshape(-1,w.getnchannels())[:,0].astype(float)
  frequency=np.fft.rfftfreq(len(samples),1/rate)[np.argmax(abs(np.fft.rfft(samples)))]; duration=len(samples)/rate
  amplitude=np.sqrt(np.mean((samples/32768)**2))
  assert abs(amplitude - .2/np.sqrt(2)) < .005, 'Export encoding must preserve processed signal amplitude'
  assert abs(frequency-880)<3, "Video must use processed 880 Hz audio, not original 440 Hz"
  assert 2.7<duration<3.3, "Delayed video playback must preserve the three-second output"
  print('PASS: identical original video frames, processed audio, duration and invalid input rejection')
  await b.close()
asyncio.run(main())
