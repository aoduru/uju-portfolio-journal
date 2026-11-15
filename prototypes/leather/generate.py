import numpy as np
from scipy.spatial import cKDTree
from scipy.ndimage import gaussian_filter
from PIL import Image

N = 1024

def smoothstep(x):
    x = np.clip(x, 0, 1); return x * x * (3 - 2 * x)

def wrapnoise(seed, sigma):
    n = gaussian_filter(np.random.RandomState(seed).rand(N, N), sigma, mode='wrap')
    return (n - n.mean()) / n.std()

def cellular(npts, seed, warp):
    r = np.random.RandomState(seed)
    pts = r.rand(npts, 2)
    tiled = np.concatenate([pts + (i, j) for i in (-1,0,1) for j in (-1,0,1)])
    tree = cKDTree(tiled)
    g = (np.arange(N) + 0.5) / N
    gx, gy = np.meshgrid(g, g)
    gx = gx + warp * wrapnoise(seed + 101, 4)
    gy = gy + warp * wrapnoise(seed + 202, 4)
    q = np.stack([gx.ravel() + 1, gy.ravel() + 1], axis=1)
    d, _ = tree.query(q, k=2, n_jobs=-1)
    return d[:, 0].reshape(N, N), d[:, 1].reshape(N, N)

# ---- HEIGHT: bigger pebbles than before (450 cells, not 1100) -------------
f1, f2 = cellular(900, 11, warp=0.0045)
crease = smoothstep((f2 - f1) / 0.011)
dome   = smoothstep(1 - f1 / np.percentile(f1, 97) * 1.45)
c1, c2 = cellular(40, 23, warp=0.035)
swell  = smoothstep((c2 - c1) / 0.08)

m1, m2 = cellular(7000, 41, warp=0.002)
micro  = smoothstep((m2 - m1) / 0.004)

height = 0.50 * crease + 0.26 * dome + 0.09 * swell + 0.15 * micro
height = height + 0.04 * wrapnoise(31, 0.7)
height = gaussian_filter(height, 0.6, mode='wrap')

# ---- LIGHT IT -------------------------------------------------------------
# This is what the first attempt was missing. A height field on its own is a
# flat map of high and low; what makes a photograph of leather read as RELIEF
# is a light source -- bright on the side of each bump facing the light, dark
# on the far side, dark in the creases. Rolled differences rather than
# np.gradient so the derivative wraps and the tile stays seamless.
dx = (np.roll(height, -1, 1) - np.roll(height, 1, 1)) * 0.5
dy = (np.roll(height, -1, 0) - np.roll(height, 1, 0)) * 0.5
LX, LY = -0.62, -0.78                     # light from upper-left
lit = -(dx * LX + dy * LY)
lit = lit / lit.std()

# Ambient occlusion: creases stay dark whichever way the light faces, which is
# what stops it looking like embossed foil.
ao = (height - height.mean()) / height.std()

g = 0.86 * lit + 0.34 * ao
g = np.tanh(g * 0.85)                     # roll off the specular tips

g = (g - g.mean()) / g.std()
g = 0.5 + g * 0.150                       # ~2x the contrast of attempt one
img = Image.fromarray((np.clip(g, 0, 1) * 255).astype(np.uint8), 'L')
img.save('leather-grain-v4.png')
a = np.asarray(img)
print('tile  mean %.1f  sd %.1f  range %d-%d' % (a.mean(), a.std(), a.min(), a.max()))

COVER = (196, 71, 43)
tile = a.astype(np.float32) / 255.0
two = np.tile(tile, (2, 2))
base = np.zeros(two.shape + (3,), np.float32); base[:] = np.array(COVER, np.float32)/255.
def overlay(b, gg, amt):
    o = np.where(b < 0.5, 2*b*gg, 1 - 2*(1-b)*(1-gg))
    return b*(1-amt) + o*amt
for amt, name in ((0.30,'v4-30.png'), (0.55,'v4-55.png')):
    out = np.stack([overlay(base[...,k], two, amt) for k in range(3)], -1)
    Image.fromarray((np.clip(out,0,1)*255).astype(np.uint8),'RGB')\
         .resize((1000,1000), Image.LANCZOS).save(name)
print('previews at 30% and 55%')
