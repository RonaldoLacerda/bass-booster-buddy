import asyncio,json,os,subprocess
from pathlib import Path
from playwright.async_api import async_playwright
TMP = Path('/tmp/browser/audiomix-video-playback')
TMP.mkdir(parents=True, exist_ok=True)
subprocess.run(['ffmpeg','-y','-f','lavfi','-i','testsrc2=size=640x360:rate=30:duration=5','-f','lavfi','-i','sine=frequency=440:duration=5','-c:v','libvpx','-c:a','libopus','-shortest',str(TMP / 'input.webm'),'-loglevel','error'],check=True)
async def main():
 async with async_playwright() as p:
  b=await p.chromium.launch(headless=True)
  context=await b.new_context(viewport={"width":1280,"height":1800})
  page=await context.new_page()
  errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
  with open(os.path.expanduser('~/.cache/lovable-auth/session.json')) as f: minted=json.load(f)
  await page.goto('http://localhost:8080')
  await page.evaluate('([k,v])=>localStorage.setItem(k,v)',[minted['storage_key'],json.dumps(minted['session'])])
  await page.evaluate("localStorage.setItem('audiomix.onboarding.studio','1')")
  await page.goto('http://localhost:8080/studio',wait_until='networkidle')
  
  await page.locator('input[type=file]').first.set_input_files({'name':'camera.MP4','mimeType':'application/octet-stream','buffer':(TMP / 'input.webm').read_bytes()})
  await page.get_by_role('button',name='Tocar',exact=True).wait_for()
  await page.wait_for_function("document.querySelector('button[aria-label=Tocar]')?.disabled===false")
  await page.get_by_role('button',name='Tocar',exact=True).click()
  await page.wait_for_timeout(1500)
  print('MEDIA',await page.locator('video,audio').evaluate_all('(els)=>els.map(e=>({tag:e.tagName,paused:e.paused,time:e.currentTime,ready:e.readyState,frames:e.getVideoPlaybackQuality?.().totalVideoFrames}))'))
  state=await page.locator('video').evaluate('(e)=>({paused:e.paused,time:e.currentTime,frames:e.getVideoPlaybackQuality().totalVideoFrames})')
  assert not state['paused'] and state['time']>1 and state['frames']>20,state
  await page.screenshot(path=str(TMP / 'play.png'))
  await page.get_by_role('button',name='Pausar',exact=True).click()
  assert await page.locator('video').evaluate('(e)=>e.paused')

  await page.get_by_role('switch').first.click()
  await page.get_by_role('button',name='Tocar',exact=True).click()
  await page.wait_for_timeout(500)
  assert await page.locator('video').evaluate('(e)=>!e.paused')
  print('PASS: video with generic MIME, moving frames, pause and original comparison')
  print('errors',errors)
  assert not errors, errors
  await b.close()
asyncio.run(main())
