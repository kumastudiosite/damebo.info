/**
 * M1: Geometry Utils
 */

function isPointOnSegment(p, s) {
    const minX = Math.min(s.p1.x, s.p2.x);
    const maxX = Math.max(s.p1.x, s.p2.x);
    const minY = Math.min(s.p1.y, s.p2.y);
    const maxY = Math.max(s.p1.y, s.p2.y);
    return p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY;
}

function doSegmentsIntersectOrTouch(s1, s2) {
    if (isPointOnSegment(s1.p1, s2)) return true;
    if (isPointOnSegment(s1.p2, s2)) return true;
    if (isPointOnSegment(s2.p1, s1)) return true;
    if (isPointOnSegment(s2.p2, s1)) return true;

    const isH1 = s1.p1.y === s1.p2.y;
    const isH2 = s2.p1.y === s2.p2.y;

    if (isH1 !== isH2) {
        const hSeg = isH1 ? s1 : s2;
        const vSeg = isH1 ? s2 : s1;
        const minX = Math.min(hSeg.p1.x, hSeg.p2.x);
        const maxX = Math.max(hSeg.p1.x, hSeg.p2.x);
        const minY = Math.min(vSeg.p1.y, vSeg.p2.y);
        const maxY = Math.max(vSeg.p1.y, vSeg.p2.y);

        if (vSeg.p1.x > minX && vSeg.p1.x < maxX && hSeg.p1.y > minY && hSeg.p1.y < maxY) {
            return true;
        }
    }
    return false;
}

function polylineToSegments(polyline) {
    const segments = [];
    for (let i = 0; i < polyline.length - 1; i++) {
        segments.push({ p1: polyline[i], p2: polyline[i + 1] });
    }
    return segments;
}

function doArrowsIntersect(arrow1, arrow2) {
    const segs1 = polylineToSegments(arrow1.polyline);
    const segs2 = polylineToSegments(arrow2.polyline);
    for (const s1 of segs1) {
        for (const s2 of segs2) {
            if (doSegmentsIntersectOrTouch(s1, s2)) return true;
        }
    }
    return false;
}

function checkSelfIntersection(arrow) {
    const segs = polylineToSegments(arrow.polyline);
    for (let i = 0; i < segs.length; i++) {
        for (let j = i + 2; j < segs.length; j++) {
            if (doSegmentsIntersectOrTouch(segs[i], segs[j])) return true;
        }
    }
    return false;
}

function checkFaceToFace(headA, dirA, headB, dirB) {
    const isOpposite = (dirA === 'U' && dirB === 'D') ||
        (dirA === 'D' && dirB === 'U') ||
        (dirA === 'L' && dirB === 'R') ||
        (dirA === 'R' && dirB === 'L');
    if (!isOpposite) return false;

    if (dirA === 'U') return headA.x === headB.x && headB.y < headA.y;
    if (dirA === 'D') return headA.x === headB.x && headB.y > headA.y;
    if (dirA === 'L') return headA.y === headB.y && headB.x < headA.x;
    if (dirA === 'R') return headA.y === headB.y && headB.x > headA.x;
    return false;
}

const DIR_VECS = {
    'U': { x: 0, y: -1 },
    'D': { x: 0, y: 1 },
    'L': { x: -1, y: 0 },
    'R': { x: 1, y: 0 }
};

function getBBox(polyline) {
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (let p of polyline) {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
    }
    return { minX, maxX, minY, maxY };
}

function advanceArrow(polyline, dir, distance) {
    if (distance <= 0) return JSON.parse(JSON.stringify(polyline));
    let pts = JSON.parse(JSON.stringify(polyline));

    const head = pts[pts.length - 1];
    const v = DIR_VECS[dir];
    pts.push({ x: head.x + v.x * distance, y: head.y + v.y * distance });

    let rem = distance;
    while (rem > 0 && pts.length > 1) {
        let tail = pts[0];
        let next = pts[1];
        let dx = next.x - tail.x;
        let dy = next.y - tail.y;
        let segLen = Math.abs(dx) + Math.abs(dy);

        if (rem >= segLen - 1e-9) {
            rem -= segLen;
            pts.shift();
        } else {
            let ndx = dx === 0 ? 0 : Math.sign(dx);
            let ndy = dy === 0 ? 0 : Math.sign(dy);
            pts[0] = { x: tail.x + ndx * rem, y: tail.y + ndy * rem };
            rem = 0;
        }
    }
    return simplifyPolyline(pts);
}

function simplifyPolyline(pts) {
    if (pts.length <= 2) return pts;
    let res = [pts[0]];
    for (let i = 1; i < pts.length - 1; i++) {
        let prev = res[res.length - 1];
        let curr = pts[i];
        let next = pts[i + 1];

        let dx1 = curr.x - prev.x; let dy1 = curr.y - prev.y;
        let dx2 = next.x - curr.x; let dy2 = next.y - curr.y;

        let dir1 = dx1 === 0 ? (dy1 > 0 ? 'D' : (dy1 < 0 ? 'U' : '')) : (dx1 > 0 ? 'R' : (dx1 < 0 ? 'L' : ''));
        let dir2 = dx2 === 0 ? (dy2 > 0 ? 'D' : (dy2 < 0 ? 'U' : '')) : (dx2 > 0 ? 'R' : (dx2 < 0 ? 'L' : ''));

        if (dir1 === dir2 && dir1 !== '') continue;
        res.push(curr);
    }
    res.push(pts[pts.length - 1]);
    return res;
}

/**
 * M3: Movement & Path Calculation
 */
function findPathResult(arrow, otherArrows, W, H) {
    let poly = arrow.polyline;
    const dir = arrow.dir;
    let dist = 0;

    // 頭が壁に向かっているのに進もうとしている場合を事前チェック
    const head = poly[poly.length - 1];
    if (dir === 'U' && head.y <= 0) return { distance: 0, intersects: true };
    if (dir === 'D' && head.y >= H) return { distance: 0, intersects: true };
    if (dir === 'L' && head.x <= 0) return { distance: 0, intersects: true };
    if (dir === 'R' && head.x >= W) return { distance: 0, intersects: true };

    while (true) {
        let nextPoly = advanceArrow(poly, dir, 1);
        let nextArrow = { ...arrow, polyline: nextPoly };
        dist += 1;

        if (checkSelfIntersection(nextArrow)) return { distance: dist, intersects: true };
        for (let other of otherArrows) {
            if (doArrowsIntersect(nextArrow, other)) return { distance: dist, intersects: true };
        }

        let bbox = getBBox(nextPoly);
        if (bbox.maxX < 0 || bbox.minX > W || bbox.maxY < 0 || bbox.minY > H) {
            return { distance: dist, intersects: false };
        }

        let sameCount = 0;
        if (poly.length === nextPoly.length) {
            for (let i = 0; i < poly.length; i++) {
                if (poly[i].x === nextPoly[i].x && poly[i].y === nextPoly[i].y) sameCount++;
            }
        }
        if (sameCount === poly.length) return { distance: dist, intersects: true }; // 進めなくなった = 壁ドン

        if (dist > (W + H) * 2) return { distance: dist, intersects: true }; // 脱出できずループ
        poly = nextPoly;
    }
}

function distToSegment(px, py, x1, y1, x2, y2) {
    let l2 = (x1 - x2) ** 2 + (y1 - y2) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, py - y1);
    let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

function getClickedArrow(px, py, arrows, cellSize, padding) {
    let gx = (px - padding) / cellSize;
    let gy = (py - padding) / cellSize;

    const margin = 0.5;
    for (let arrow of arrows) {
        let segs = polylineToSegments(arrow.polyline);
        for (let s of segs) {
            if (distToSegment(gx, gy, s.p1.x, s.p1.y, s.p2.x, s.p2.y) < margin) return arrow;
        }
    }
    return null;
}

/**
 * M4 & M5: Generator and Solver
 */
class Mulberry32 {
    constructor(seed) { this.seed = seed; }
    next() {
        let t = this.seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
    nextRange(min, max) { return Math.floor(this.next() * (max - min + 1)) + min; }
    choice(arr) { return arr[this.nextRange(0, arr.length - 1)]; }
}

function solveLevel(levelBase) {
    const W = levelBase.grid.w;
    const H = levelBase.grid.h;

    let localArrows = [...levelBase.arrows];
    let path = [];
    let changed = true;

    // Greedy removal phase: ぶつからずに消せる矢印はすべて無条件で消していく
    // Arrowstreamのルール上、障害物が減ることは他の矢印の脱出を妨げないため、
    // 順番によらず「消せるものを全て消す」だけで完全なクリア判定が可能
    while (changed && localArrows.length > 0) {
        changed = false;
        for (let i = 0; i < localArrows.length; i++) {
            const arr = localArrows[i];
            const others = localArrows.filter(a => a.id !== arr.id);
            const res = findPathResult(arr, others, W, H);

            if (!res.intersects) {
                path.push(arr.id);
                localArrows.splice(i, 1);
                changed = true;
                break;
            }
        }
    }

    if (localArrows.length === 0) {
        return { solvable: true, minMoves: path.length, solution: path };
    } else {
        return { solvable: false };
    }
}

function generateLevel(params, log = null) {
    function addLog(msg) { if (log) log.push(msg); }
    const rng = new Mulberry32(params.seed);
    const arrows = [];

    addLog(`[Seed: ${params.seed}] Start generateLevel W:${params.w} H:${params.h} TargetArrows:${params.numArrows}`);

    let attempts = 0;
    while (arrows.length < params.numArrows && attempts < 5000) {
        attempts++;

        let currentPos = { x: rng.nextRange(1, params.w - 1), y: rng.nextRange(1, params.h - 1) };
        let currentDir = rng.choice(['U', 'D', 'L', 'R']);

        let polyline = [currentPos];
        let v = DIR_VECS[currentDir];

        let initLen = rng.nextRange(1, 2);
        let nextPos = { x: currentPos.x + v.x * initLen, y: currentPos.y + v.y * initLen };

        if (nextPos.x <= 0 || nextPos.x >= params.w || nextPos.y <= 0 || nextPos.y >= params.h) continue;
        polyline.push(nextPos);

        let arrow = { id: `a${arrows.length + 1}`, polyline: simplifyPolyline(polyline), dir: currentDir };
        if (checkSelfIntersection(arrow)) continue;

        let conflict = false;
        for (let existing of arrows) {
            if (doArrowsIntersect(arrow, existing)) { conflict = true; break; }
            let headA = arrow.polyline[arrow.polyline.length - 1]; let dirA = arrow.dir;
            let headE = existing.polyline[existing.polyline.length - 1]; let dirE = existing.dir;
            if (checkFaceToFace(headA, dirA, headE, dirE) || checkFaceToFace(headE, dirE, headA, dirA)) {
                conflict = true; break;
            }
        }
        if (conflict) continue;

        arrows.push(arrow);
        // Ensure new seed doesn't brick the existing solvable board
        if (!solveLevel({ grid: { w: params.w, h: params.h }, arrows }).solvable) {
            arrows.pop();
        }
    }

    if (arrows.length < params.numArrows) {
        addLog(`[Seed: ${params.seed}] Failed initial seeds. Placed ${arrows.length}/${params.numArrows} after ${attempts} attempts`);
        return null; // 種の配置すら失敗した場合は破棄
    }

    addLog(`[Seed: ${params.seed}] Placed ${arrows.length} seeds safely. Extending...`);

    // Step 2: extendArrows を用いて、空きスペースを埋めるように成長させる
    extendArrows(arrows, params.w, params.h, rng);

    // Step 3: さらに空いているスペースがあれば、追加の種を撒いて成長させる
    function tryPlaceSeed() {
        let currentPos = { x: rng.nextRange(1, params.w - 1), y: rng.nextRange(1, params.h - 1) };
        let currentDir = rng.choice(['U', 'D', 'L', 'R']);
        let polyline = [currentPos];
        let v = DIR_VECS[currentDir];

        // 初期長さは短く（1または2マス）
        let initLen = rng.nextRange(1, 2);
        let nextPos = { x: currentPos.x + v.x * initLen, y: currentPos.y + v.y * initLen };

        if (nextPos.x <= 0 || nextPos.x >= params.w || nextPos.y <= 0 || nextPos.y >= params.h) return false;
        polyline.push(nextPos);

        let arrow = { id: `a${arrows.length + 1}`, polyline: simplifyPolyline(polyline), dir: currentDir };
        if (checkSelfIntersection(arrow)) return false;

        for (let existing of arrows) {
            if (doArrowsIntersect(arrow, existing)) return false;
            let headA = arrow.polyline[arrow.polyline.length - 1]; let dirA = arrow.dir;
            let headE = existing.polyline[existing.polyline.length - 1]; let dirE = existing.dir;
            if (checkFaceToFace(headA, dirA, headE, dirE) || checkFaceToFace(headE, dirE, headA, dirA)) {
                return false;
            }
        }

        arrows.push(arrow);
        if (solveLevel({ grid: { w: params.w, h: params.h }, arrows }).solvable) {
            return true;
        } else {
            arrows.pop();
            return false;
        }
    }

    addLog(`[Seed: ${params.seed}] Initial extend completed. Starting tryPlaceSeed...`);
    let extraAttempts = 0;
    let addedSeedCount = 0;
    while (extraAttempts < 500) {
        if (tryPlaceSeed()) {
            addedSeedCount++;
            extraAttempts = 0; // 追加されたらまたリセットして成長させる
            extendArrows(arrows, params.w, params.h, rng);
        } else {
            extraAttempts++;
        }
    }

    addLog(`[Seed: ${params.seed}] Added ${addedSeedCount} extra seeds. Total arrows: ${arrows.length}`);

    // 最低長のチェック（minLen）は「可能な限り成長させる」方針のため不要となり削除しました

    return { grid: { w: params.w, h: params.h }, arrows, meta: { seed: params.seed } };
}

function extendArrows(arrows, w, h, rng) {
    function tryGrowHeadTurn(arrow) {
        const head = arrow.polyline[arrow.polyline.length - 1];

        let dirs = [];
        dirs.push(arrow.dir); // 基本は直進

        let turns = (arrow.dir === 'U' || arrow.dir === 'D') ? ['L', 'R'] : ['U', 'D'];
        if (rng.nextRange(0, 1) === 0) turns.reverse();

        // 60%の確率で、直進よりも「曲がる」ことを優先してテストする
        if (rng.nextRange(0, 100) < 60) {
            dirs = [...turns, arrow.dir];
        } else {
            dirs.push(...turns);
        }

        for (let testDir of dirs) {
            const v = DIR_VECS[testDir];
            const nextPos = { x: head.x + v.x, y: head.y + v.y };

            if (nextPos.x <= 0 || nextPos.x >= w || nextPos.y <= 0 || nextPos.y >= h) continue;

            let newPolyline = [...arrow.polyline];
            newPolyline.push(nextPos);
            newPolyline = simplifyPolyline(newPolyline);

            const testArrow = { ...arrow, polyline: newPolyline, dir: testDir };

            if (checkSelfIntersection(testArrow)) continue;

            let conflict = false;
            for (let other of arrows) {
                if (other.id === arrow.id) continue;
                if (doArrowsIntersect(testArrow, other)) { conflict = true; break; }

                let headA = testArrow.polyline[testArrow.polyline.length - 1]; let dirA = testArrow.dir;
                let headE = other.polyline[other.polyline.length - 1]; let dirE = other.dir;
                if (checkFaceToFace(headA, dirA, headE, dirE) || checkFaceToFace(headE, dirE, headA, dirA)) {
                    conflict = true; break;
                }
            }
            if (conflict) continue;

            let originalPoly = arrow.polyline;
            let originalDir = arrow.dir;
            arrow.polyline = testArrow.polyline;
            arrow.dir = testArrow.dir;

            // Maintain solvability invariant!
            if (solveLevel({ grid: { w, h }, arrows }).solvable) {
                return true;
            } else {
                arrow.polyline = originalPoly;
                arrow.dir = originalDir;
            }
        }
        return false;
    }

    function tryGrowTailTurn(arrow) {
        if (arrow.polyline.length < 2) return false;
        const p0 = arrow.polyline[0];
        const p1 = arrow.polyline[1];

        let dx = p0.x - p1.x;
        let dy = p0.y - p1.y;
        dx = dx === 0 ? 0 : Math.sign(dx);
        dy = dy === 0 ? 0 : Math.sign(dy);

        let dirs = [];
        let forwardDir = { x: dx, y: dy, isTurn: false };
        dirs.push(forwardDir);

        let turns = [{ x: -dy, y: dx, isTurn: true }, { x: dy, y: -dx, isTurn: true }];
        if (rng.nextRange(0, 1) === 0) turns.reverse();

        // 頭と同様に尾の成長時も、60%の確率で曲がることを優先する
        if (rng.nextRange(0, 100) < 60) {
            dirs = [...turns, forwardDir];
        } else {
            dirs.push(...turns);
        }

        for (let d of dirs) {
            const prevPos = { x: p0.x + d.x, y: p0.y + d.y };
            if (prevPos.x <= 0 || prevPos.x >= w || prevPos.y <= 0 || prevPos.y >= h) continue;

            let newPolyline = [prevPos, ...arrow.polyline];
            newPolyline = simplifyPolyline(newPolyline);

            const testArrow = { ...arrow, polyline: newPolyline };

            if (checkSelfIntersection(testArrow)) continue;

            let conflict = false;
            for (let other of arrows) {
                if (other.id === arrow.id) continue;
                if (doArrowsIntersect(testArrow, other)) { conflict = true; break; }
            }
            if (conflict) continue;

            let originalPoly = arrow.polyline;
            arrow.polyline = testArrow.polyline;

            // Maintain solvability invariant!
            if (solveLevel({ grid: { w, h }, arrows }).solvable) {
                return true;
            } else {
                arrow.polyline = originalPoly;
            }
        }
        return false;
    }

    for (let arrow of arrows) {
        if (arrow.growthRate === undefined) {
            arrow.growthRate = 0.1 + (rng.next() * 0.9);
        }
    }

    let changed = true;
    let iterations = 0;
    while (changed && iterations < 4000) {
        changed = false;
        iterations++;

        let indices = Array.from({ length: arrows.length }, (_, i) => i);
        for (let i = indices.length - 1; i > 0; i--) {
            const j = rng.nextRange(0, i);
            [indices[i], indices[j]] = [indices[j], indices[i]];
        }

        for (let idx of indices) {
            let arrow = arrows[idx];

            if (rng.next() > arrow.growthRate) {
                continue;
            }

            if (rng.nextRange(0, 1) === 0) {
                if (tryGrowHeadTurn(arrow)) { changed = true; continue; }
                if (tryGrowTailTurn(arrow)) { changed = true; continue; }
            } else {
                if (tryGrowTailTurn(arrow)) { changed = true; continue; }
                if (tryGrowHeadTurn(arrow)) { changed = true; continue; }
            }
        }
    }
}

/**
 * M2: Canvas Rendering
 */
const COLORS = [
    '#EF5350', '#EC407A', '#AB47BC', '#7E57C2', '#5C6BC0',
    '#42A5F5', '#29B6F6', '#26C6DA', '#26A69A', '#66BB6A',
    '#9CCC65', '#D4E157', '#FFEE58', '#FFCA28', '#FFA726', '#FF7043'
];

class Renderer {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.cellSize = 40;
        this.padding = 40;
    }

    resize(gridW, gridH) {
        const expectedWidth = gridW * this.cellSize + this.padding * 2;
        const expectedHeight = gridH * this.cellSize + this.padding * 2;

        if (this.canvas.width !== expectedWidth || this.canvas.height !== expectedHeight) {
            this.canvas.width = expectedWidth;
            this.canvas.height = expectedHeight;
            this.canvas.style.width = expectedWidth + 'px';
            this.canvas.style.height = expectedHeight + 'px';
        }
    }

    worldToScreen(x, y) {
        return { x: this.padding + x * this.cellSize, y: this.padding + y * this.cellSize };
    }

    drawGrid(w, h) {
        this.ctx.strokeStyle = '#444';
        this.ctx.lineWidth = 1;
        for (let x = 0; x <= w; x++) {
            this.ctx.beginPath();
            const start = this.worldToScreen(x, 0);
            const end = this.worldToScreen(x, h);
            this.ctx.moveTo(start.x, start.y);
            this.ctx.lineTo(end.x, end.y);
            this.ctx.stroke();
        }
        for (let y = 0; y <= h; y++) {
            this.ctx.beginPath();
            const start = this.worldToScreen(0, y);
            const end = this.worldToScreen(w, y);
            this.ctx.moveTo(start.x, start.y);
            this.ctx.lineTo(end.x, end.y);
            this.ctx.stroke();
        }
    }

    drawArrow(arrow, colorIdx) {
        if (!arrow.polyline || arrow.polyline.length === 0) return;

        const pts = arrow.polyline.map(p => this.worldToScreen(p.x, p.y));
        const color = COLORS[colorIdx % COLORS.length];

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 6;
        this.ctx.lineJoin = 'round';
        this.ctx.lineCap = 'round';

        this.ctx.beginPath();
        this.ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) this.ctx.lineTo(pts[i].x, pts[i].y);
        this.ctx.stroke();

        const head = pts[pts.length - 1];
        const dir = arrow.dir;
        this.ctx.fillStyle = color;
        this.ctx.beginPath();

        const arrowSize = 12;
        if (dir === 'U') {
            this.ctx.moveTo(head.x, head.y - arrowSize);
            this.ctx.lineTo(head.x - arrowSize, head.y + arrowSize);
            this.ctx.lineTo(head.x + arrowSize, head.y + arrowSize);
        } else if (dir === 'D') {
            this.ctx.moveTo(head.x, head.y + arrowSize);
            this.ctx.lineTo(head.x - arrowSize, head.y - arrowSize);
            this.ctx.lineTo(head.x + arrowSize, head.y - arrowSize);
        } else if (dir === 'L') {
            this.ctx.moveTo(head.x - arrowSize, head.y);
            this.ctx.lineTo(head.x + arrowSize, head.y - arrowSize);
            this.ctx.lineTo(head.x + arrowSize, head.y + arrowSize);
        } else if (dir === 'R') {
            this.ctx.moveTo(head.x + arrowSize, head.y);
            this.ctx.lineTo(head.x - arrowSize, head.y - arrowSize);
            this.ctx.lineTo(head.x - arrowSize, head.y + arrowSize);
        }
        this.ctx.fill();
    }

    render(gameState, animEvents = []) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (!gameState || !gameState.grid) return;

        this.resize(gameState.grid.w, gameState.grid.h);
        this.drawGrid(gameState.grid.w, gameState.grid.h);

        // Helper to get consistent color index from ID (e.g., "a5" -> 5)
        const getColorIndex = (id) => parseInt(id.replace(/[^0-9]/g, ''), 10) || 0;

        // First draw all static arrows
        if (gameState.arrows) {
            gameState.arrows.forEach((arr) => {
                const isAnimating = animEvents.some(evt => evt.arrowId === arr.id);
                if (!isAnimating && arr.polyline.length > 0) {
                    this.drawArrow(arr, getColorIndex(arr.id));
                }
            });
        }

        // Then draw all animating arrows
        if (animEvents.length > 0) {
            animEvents.forEach(evt => {
                let drawArr = {
                    ...evt.originalArrow,
                    polyline: advanceArrow(evt.originalArrow.polyline, evt.originalArrow.dir, evt.currentDist)
                };
                if (drawArr.polyline.length > 0) {
                    this.drawArrow(drawArr, getColorIndex(evt.arrowId));
                }
            });
        }
    }
}

/**
 * Damebo Voice Mapping
 */
const VOICE_MAP = {
    1: '../sounds/damebo001_11_たたかれる.wav',
    2: '../sounds/damebo002_11_たたかれる.wav',
    3: '../sounds/damebo003_11_たたかれる.wav',
    4: '../sounds/damebo004_11_たたかれる.wav',
    5: '../sounds/damebo006_11_たたかれる.wav', // 005欠番のため006を代用
    6: '../sounds/damebo006_11_たたかれる.wav',
    7: '../sounds/damebo007_11_たたかれる.wav',
    8: '../sounds/damebo008_11_たたかれる.wav',
    9: '../sounds/damebo009_11_たたかれる.wav',
    10: '../sounds/damebo001_11_たたかれる.wav' 
};

function playDamageVoice(arrowId) {
    const colorIndex = parseInt(arrowId.replace(/[^0-9]/g, ''), 10) || 0;
    const src = VOICE_MAP[colorIndex] || VOICE_MAP[1];
    if (src) {
        const audio = new Audio(src);
        audio.play().catch(e => console.log('Audio play blocked:', e));
    }
}

/**
 * App State & Main Loop
 */
const appState = {
    mode: 'play',
    playLevel: null,
    initialLevelBackup: null,
    devLevel: null,
    animEvents: [],
    crossEvents: 0
};

const playRenderer = new Renderer('game-canvas');
const devRenderer = new Renderer('dev-canvas');

function updateStatusUI() {
    document.getElementById('cross-events-disp').textContent = `Cross Events: ${appState.crossEvents} / 3`;
    const statusEl = document.getElementById('game-status');
    const retryBtn = document.getElementById('btn-retry-level');
    const nextBtn = document.getElementById('btn-next-level');

    if (appState.crossEvents >= 3) {
        statusEl.textContent = 'GAME OVER - 3 Crosses!';
        statusEl.style.color = '#EF5350';
        retryBtn.style.display = 'inline-block';
        if (nextBtn) nextBtn.style.display = 'none';
    } else if (appState.playLevel && appState.playLevel.arrows.length === 0) {
        statusEl.textContent = 'LEVEL CLEARED!';
        statusEl.style.color = '#66BB6A';
        retryBtn.style.display = 'inline-block'; // 繰り返しあそべるようにする
        if (nextBtn) nextBtn.style.display = 'none'; // 体験版仕様として次への導線を消す
    } else {
        statusEl.textContent = '';
        retryBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
    }
}

document.getElementById('btn-retry-level').addEventListener('click', () => {
    if (appState.initialLevelBackup) {
        // Deep copy from the backup to restore the level exactly as it was
        appState.playLevel = JSON.parse(JSON.stringify(appState.initialLevelBackup));
        appState.crossEvents = 0;
        appState.animEvents = [];
        updateStatusUI();
        playRenderer.render(appState.playLevel, appState.animEvents);
    }
});

document.getElementById('btn-next-level').addEventListener('click', async () => {
    try {
        const cacheBuster = '?t=' + new Date().getTime();
        const dirRes = await fetch('../levels/' + cacheBuster);
        if (!dirRes.ok) throw new Error("Could not fetch levels/ directory: " + dirRes.statusText);
        const html = await dirRes.text();

        // Match standard directory listing formats for arrowstream_*.json
        const matches = [...html.matchAll(/href="([^"]*arrowstream_[^"]*\.json)"/ig)];
        let list = matches.map(m => m[1]);

        // Some servers include multiple links per file, ensure uniqueness
        list = [...new Set(list)];

        if (list.length === 0) {
            throw new Error("No arrowstream_*.json files found. Are you using a static local server without directory listing enabled?");
        }

        // Exclude the current level if there are multiple levels
        let availableList = list;
        if (appState.playLevel && appState.playLevel.meta && appState.playLevel.meta.seed) {
            const currentSeed = appState.playLevel.meta.seed;
            availableList = list.filter(fileName => !fileName.includes(currentSeed.toString()));
            if (availableList.length === 0) availableList = list; // fallback if it's the only one
        }

        let file = availableList[Math.floor(Math.random() * availableList.length)];

        // Extract just the filename in case the href included a path
        const fileName = file.split('/').pop();

        const lvlRes = await fetch(`../levels/${fileName}${cacheBuster}`);
        if (!lvlRes.ok) throw new Error(`Could not fetch ${fileName}`);
        const newLevel = await lvlRes.json();

        appState.playLevel = JSON.parse(JSON.stringify(newLevel));
        appState.initialLevelBackup = JSON.parse(JSON.stringify(newLevel));
        appState.crossEvents = 0;
        appState.animEvents = [];
        updateStatusUI();
        playRenderer.render(appState.playLevel, appState.animEvents);
    } catch (e) {
        console.error("Error loading next level:", e);
        alert("次のステージの読み込みに失敗しました。ローカルサーバでディレクトリ一覧機能（Directory Listing）が有効になっているか確認してください。\n詳細: " + e.message);
    }
});

document.querySelectorAll('input[name="mode"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        appState.mode = e.target.value;
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(`${appState.mode}-ui`).classList.add('active');

        if (appState.mode === 'play' && appState.playLevel) {
            playRenderer.render(appState.playLevel, appState.animEvent);
        } else if (appState.mode === 'dev' && appState.devLevel) {
            devRenderer.render(appState.devLevel);
        }
    });
});

playRenderer.canvas.addEventListener('click', (e) => {
    if (appState.mode !== 'play' || appState.crossEvents >= 3) return;
    if (!appState.playLevel || appState.playLevel.arrows.length === 0) return;

    // Check if the user clicked an arrow that is already animating
    const isAnimating = (id) => appState.animEvents.some(evt => evt.arrowId === id);

    const rect = playRenderer.canvas.getBoundingClientRect();
    const scaleX = playRenderer.canvas.width / rect.width;
    const scaleY = playRenderer.canvas.height / rect.height;
    const px = (e.clientX - rect.left) * scaleX;
    const py = (e.clientY - rect.top) * scaleY;

    // Filter out arrows that are already animating (successful ones are already removed from playLevel.arrows anyway, but just in case)
    const clickableArrows = appState.playLevel.arrows.filter(a => !isAnimating(a.id));
    const clicked = getClickedArrow(px, py, clickableArrows, playRenderer.cellSize, playRenderer.padding);

    if (clicked) {
        const others = appState.playLevel.arrows.filter(a => a.id !== clicked.id);
        const res = findPathResult(clicked, others, appState.playLevel.grid.w, appState.playLevel.grid.h);

        const newAnimEvent = {
            arrowId: clicked.id,
            originalArrow: JSON.parse(JSON.stringify(clicked)),
            pathResult: res,
            currentDist: 0,
            state: 'forward'
        };

        appState.animEvents.push(newAnimEvent);

        // IMMEDIATE LOGIC APPLICATION:
        // If it does NOT intersect, it means it will successfully escape.
        // We can immediately remove it from the logical `playLevel.arrows` array 
        // so that the player can tap the next arrow without waiting.
        if (!res.intersects) {
            appState.playLevel.arrows = appState.playLevel.arrows.filter(a => a.id !== clicked.id);
            updateStatusUI();
            // The renderer will still draw it because we pass animEvents to playRenderer.render
        }
    }
});

let lastTime = performance.now();
function gameLoop(time) {
    requestAnimationFrame(gameLoop);
    let dt = (time - lastTime) / 1000;
    lastTime = time;
    if (dt > 0.1) dt = 0.1;

    let needsRender = false;

    if (appState.animEvents && appState.animEvents.length > 0) {
        const speed = 12;

        for (let i = appState.animEvents.length - 1; i >= 0; i--) {
            let evt = appState.animEvents[i];
            needsRender = true;

            if (evt.state === 'forward') {
                evt.currentDist += speed * dt;
                if (evt.currentDist >= evt.pathResult.distance) {
                    evt.currentDist = evt.pathResult.distance;
                    if (evt.pathResult.intersects) {
                        evt.state = 'rewind';
                        playDamageVoice(evt.arrowId);
                    } else {
                        // Animation finished, remove from animEvents
                        appState.animEvents.splice(i, 1);
                    }
                }
            } else if (evt.state === 'rewind') {
                evt.currentDist -= speed * dt * 2.5;
                if (evt.currentDist <= 0) {
                    evt.currentDist = 0;
                    appState.crossEvents++;
                    updateStatusUI();
                    appState.animEvents.splice(i, 1);
                }
            }
        }
    }

    if (appState.mode === 'play' && appState.playLevel) {
        // ALWAYS render so that other logical things or hovers could update, 
        // or throttle based on needsRender if performance becomes an issue
        playRenderer.render(appState.playLevel, appState.animEvents);
    }
}
requestAnimationFrame(gameLoop);

/**
 * M6: Dev UI Integration
 */
let generatedCandidates = [];
let selectedCandidateIdx = -1;
let globalDevLogs = [];

function renderCandidateList() {
    const listEl = document.getElementById('dev-list');
    listEl.innerHTML = '';

    generatedCandidates.forEach((cand, idx) => {
        const item = document.createElement('div');
        item.className = 'level-item' + (selectedCandidateIdx === idx ? ' selected' : '');
        item.innerHTML = `
            <div class="level-info">Seed: ${cand.level.meta.seed}</div>
            <div class="level-info">${cand.solvable ? '✅ Solvable (Moves: ' + cand.level.meta.minMoves + ')' : '❌ Unsolvable'}</div>
        `;
        item.addEventListener('click', () => {
            selectedCandidateIdx = idx;
            appState.devLevel = cand.level;
            devRenderer.render(appState.devLevel);
            document.getElementById('btn-playtest').disabled = false;
            document.getElementById('btn-download').disabled = false;
            // UPDATE: Also setup the backup here if playtest is triggered later
            // though actual backup should be when playtest starts, doing it early doesn't hurt.
            // Actually the playtest button is what triggers it.
            renderCandidateList();
        });
        listEl.appendChild(item);
    });
}

document.getElementById('btn-generate').addEventListener('click', () => {
    const w = parseInt(document.getElementById('dev-w').value);
    const h = parseInt(document.getElementById('dev-h').value);
    const numArrows = parseInt(document.getElementById('dev-arrows').value);
    let seedStr = document.getElementById('dev-seed').value;
    const n = parseInt(document.getElementById('dev-n').value);
    const solvableOnly = document.getElementById('dev-solvable').checked;

    let baseSeed = seedStr ? parseInt(seedStr) : Math.floor(Math.random() * 1000000);
    if (isNaN(baseSeed)) baseSeed = Math.floor(Math.random() * 1000000);

    document.getElementById('dev-status').textContent = `Generating ${n} levels...`;
    generatedCandidates = [];
    globalDevLogs = [`--- Generation started at ${new Date().toISOString()} ---`];
    selectedCandidateIdx = -1;
    document.getElementById('btn-playtest').disabled = true;
    document.getElementById('btn-download').disabled = true;
    renderCandidateList();

    let generatedCount = 0;
    let attempts = 0;
    let testSeed = baseSeed;

    function generateStep() {
        if (generatedCount >= n || attempts > n * 100) {
            document.getElementById('dev-status').textContent = `Done. Found ${generatedCount} / ${n} levels.`;
            return;
        }

        attempts++;
        const params = { w, h, numArrows, seed: testSeed };
        testSeed++;

        const logLines = [];
        const lvl = generateLevel(params, logLines);
        globalDevLogs.push(...logLines);

        if (lvl) {
            const sol = solveLevel(lvl);
            if (!solvableOnly || sol.solvable) {
                if (sol.solvable) {
                    lvl.meta.minMoves = sol.minMoves;
                    lvl.meta.solution = sol.solution;
                }
                generatedCandidates.push({ level: lvl, solvable: sol.solvable });
                generatedCount++;
                renderCandidateList();
            } else {
                globalDevLogs.push(`[Seed: ${params.seed}] Level was generated but solvable=${sol.solvable}`);
            }
        } else {
            globalDevLogs.push(`[Seed: ${params.seed}] generateLevel returned null.`);
        }

        // Yield to browser 
        setTimeout(generateStep, 0);
    }

    generateStep();
});

document.getElementById('btn-playtest').addEventListener('click', () => {
    if (selectedCandidateIdx >= 0) {
        appState.playLevel = JSON.parse(JSON.stringify(generatedCandidates[selectedCandidateIdx].level));
        appState.initialLevelBackup = JSON.parse(JSON.stringify(generatedCandidates[selectedCandidateIdx].level));
        appState.crossEvents = 0;
        appState.animEvents = [];
        updateStatusUI();
        document.querySelector('input[name="mode"][value="play"]').click();
        playRenderer.render(appState.playLevel, appState.animEvents);
    }
});

document.getElementById('btn-download').addEventListener('click', () => {
    if (selectedCandidateIdx >= 0) {
        const lvl = generatedCandidates[selectedCandidateIdx].level;
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(lvl, null, 2));
        const anchor = document.createElement('a');
        anchor.setAttribute("href", dataStr);
        anchor.setAttribute("download", `arrowstream_${lvl.meta.seed}.json`);
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
    }
});

document.getElementById('btn-download-log').addEventListener('click', () => {
    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(globalDevLogs.join('\n'));
    const anchor = document.createElement('a');
    anchor.setAttribute("href", dataStr);
    anchor.setAttribute("download", `arrowstream_debug_${new Date().getTime()}.log`);
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
});

// Boot Default Sample
const sampleLevel = {
    "grid": {
        "w": 10,
        "h": 12
    },
    "arrows": [
        {
            "id": "a1",
            "polyline": [
                { "x": 7, "y": 4 }, { "x": 6, "y": 4 }, { "x": 6, "y": 3 }, { "x": 7, "y": 3 }, { "x": 7, "y": 2 }, { "x": 8, "y": 2 }, { "x": 8, "y": 4 }, { "x": 9, "y": 4 }, { "x": 9, "y": 1 }, { "x": 6, "y": 1 }, { "x": 6, "y": 2 }, { "x": 5, "y": 2 }, { "x": 5, "y": 1 }
            ],
            "dir": "U",
            "growthRate": 0.5995887422934175
        },
        {
            "id": "a2",
            "polyline": [
                { "x": 6, "y": 8 }, { "x": 7, "y": 8 }, { "x": 7, "y": 7 }, { "x": 4, "y": 7 }, { "x": 4, "y": 8 }, { "x": 2, "y": 8 }, { "x": 2, "y": 9 }, { "x": 6, "y": 9 }
            ],
            "dir": "R",
            "growthRate": 0.22085159190464765
        },
        {
            "id": "a3",
            "polyline": [
                { "x": 1, "y": 5 }, { "x": 1, "y": 3 }, { "x": 3, "y": 3 }, { "x": 3, "y": 2 }, { "x": 1, "y": 2 }
            ],
            "dir": "L",
            "growthRate": 0.24056073720566928
        },
        {
            "id": "a4",
            "polyline": [
                { "x": 5, "y": 11 }, { "x": 3, "y": 11 }, { "x": 3, "y": 10 }, { "x": 6, "y": 10 }, { "x": 6, "y": 11 }, { "x": 7, "y": 11 }, { "x": 7, "y": 10 }, { "x": 9, "y": 10 }, { "x": 9, "y": 11 }
            ],
            "dir": "D",
            "growthRate": 0.9776486302958801
        },
        {
            "id": "a5",
            "polyline": [
                { "x": 1, "y": 8 }, { "x": 1, "y": 10 }, { "x": 2, "y": 10 }, { "x": 2, "y": 11 }, { "x": 1, "y": 11 }
            ],
            "dir": "L",
            "growthRate": 0.9173498054035008
        },
        {
            "id": "a6",
            "polyline": [
                { "x": 6, "y": 6 }, { "x": 4, "y": 6 }, { "x": 4, "y": 5 }, { "x": 2, "y": 5 }, { "x": 2, "y": 6 }, { "x": 3, "y": 6 }, { "x": 3, "y": 7 }, { "x": 1, "y": 7 }, { "x": 1, "y": 6 }
            ],
            "dir": "U",
            "growthRate": 0.326216900208965
        },
        {
            "id": "a7",
            "polyline": [
                { "x": 8, "y": 5 }, { "x": 9, "y": 5 }, { "x": 9, "y": 9 }
            ],
            "dir": "D",
            "growthRate": 0.3257609877502546
        },
        {
            "id": "a8",
            "polyline": [
                { "x": 1, "y": 1 }, { "x": 4, "y": 1 }, { "x": 4, "y": 3 }, { "x": 5, "y": 3 }, { "x": 5, "y": 5 }, { "x": 7, "y": 5 }, { "x": 7, "y": 6 }, { "x": 8, "y": 6 }, { "x": 8, "y": 8 }
            ],
            "dir": "D",
            "growthRate": 0.9331863731378689
        },
        {
            "id": "a9",
            "polyline": [
                { "x": 4, "y": 4 }, { "x": 2, "y": 4 }
            ],
            "dir": "L",
            "growthRate": 0.8391741005936637
        },
        {
            "id": "a10",
            "polyline": [
                { "x": 7, "y": 9 }, { "x": 8, "y": 9 }
            ],
            "dir": "R",
            "growthRate": 0.28968992321752013
        }
    ],
    "meta": {
        "seed": 296579,
        "minMoves": 10,
        "solution": ["a1", "a3", "a4", "a5", "a7", "a9", "a10", "a2", "a8", "a6"]
    }
};
appState.playLevel = JSON.parse(JSON.stringify(sampleLevel));
appState.initialLevelBackup = JSON.parse(JSON.stringify(sampleLevel));
updateStatusUI();
playRenderer.render(appState.playLevel, appState.animEvents);
