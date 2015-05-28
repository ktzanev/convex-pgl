function sortPtXY(a,b) {
  var dx = a.x.minus(b.x);
  return dx.eq(0) ? a.y.minus(b.y).toNumber() : dx.toNumber();
};

// it must be a < b.
// I put abs here to avoid '-0' precision error
function pente(a,b) {
  return b.y.minus(a.y).div(b.x.minus(a.x).abs());
};

function removeDuplicates(p) {
  for (i=0; i < p.length-1; i++)
    if (p[i].x.eq(p[i+1].x) && p[i].y.eq(p[i+1].y)) {
      p.splice(i--,1);
    }
}

function ConvexHullMin(p) {
  p.sort(sortPtXY);
  removeDuplicates(p);
  m = [];
  m0 = p[0]
  m1 = p[1];
  for (i=2; i<p.length; i++) {
    while ( pente(m1,p[i]).lte(pente(m0,m1)) ) {
      if (m.length) {
        m1 = m0;
        m0 = m.pop();
      }
      else {
        m1 = p[i];
        break;
      }
    }
    if (m1 != p[i]) {
      m.push(m0);
      m0 = m1;
      m1 = p[i];
    }
  }
  m.push(m0);
  if (m1.x > m0.x)
    m.push(m1);
  return m;
}

function reverse(pt) {
  var p = {};

  p.x = pt.x.neg();
  p.y = pt.y.neg();

  return p
}

function reverseY(pt) {
  var p = {};

  p.x = pt.x;
  p.y = pt.y.neg();

  return p
}

function ConvexHullMax(p) {
  return ConvexHullMin(p.map(reverseY)).map(reverseY);
}

function JoinMinMax(pi,pa) {
  pn = [];
  // push minimal
  ni = pi.length;
  for (i=0; i<ni; i++) {
    pn.push(pi[i]);
  }
  // push maximal (without duplicate on junction)
  na = pa.length;
  if ( ! pi[ni-1].y.eq(pa[na-1].y) )
    pn.push(pa[na-1]);
  for (i=na-2; i>=1; i--) {
    pn.push(pa[i]);
  }
  // the last point must be different from the first
  if (! pi[0].y.eq(pa[0].y) )
    pn.push(pa[0]);
  return pn;
}

function ConvexHull(p)
{
  return JoinMinMax(ConvexHullMin(p),ConvexHullMax(p));
}

function barycentrePath(p) {
  var np = p.length;
  var nx = new BigNumber(0);
  var ny = new BigNumber(0);
  var d = new BigNumber(0);
  var t;
  for (i=1;i<np;i++) {
    t = p[i-1].x.times(p[i].y).minus(p[i-1].y.times(p[i].x));
    nx = nx.plus(p[i-1].x.plus(p[i].x).times(t));
    ny = ny.plus(p[i-1].y.plus(p[i].y).times(t));
    d = d.plus(t);
  }
  t = p[np-1].x.times(p[0].y).minus(p[np-1].y.times(p[0].x));
  nx = nx.plus(p[np-1].x.plus(p[0].x).times(t));
  ny = ny.plus(p[np-1].y.plus(p[0].y).times(t));
  d = d.plus(t);
  d = d.times(3);
  return {x: nx.div(d), y: ny.div(d), s: d.div(6)};
}

function translatePath(a,v) {
    return a.map(function(p) {
        return {x: p.x.minus(v.x), y: p.y.minus(v.y)};
    });
}

function scaleToFitArea(a,max) {
    var maxcoord = a.reduce(function(prev, p){
            return Math.max(p.x.abs().toFixed(7), p.y.abs().toFixed(7), prev);;
          },max);
    var r = (new BigNumber(max)).div(maxcoord);
    return a.map(function(p) {
        return {x: p.x.times(r), y: p.y.times(r)};
    });
}

function scaleToKeepVolume(a,r) {
    return a.map(function(p) {
        return {x: p.x.times(r), y: p.y.times(r)};
    });
}



function isOutside(a,v) {
  var one = new BigNumber(1);
  return a.reduce(function(prev, p){
            return prev || one.lte(v.x.times(p.x).plus(v.y.times(p.y)));
          },false);
}

function projTransformPath(a,v) {
    var one = new BigNumber(1);

    return a.map(function(p) {
        var d = one.minus(v.x.times(p.x)).minus(v.y.times(p.y));
        return {x: p.x.div(d), y: p.y.div(d)};
    });
}

function dualPoint(p1,p2) {
  var d = p1.x.times(p2.y).minus(p1.y.times(p2.x));
  var x = p2.y.minus(p1.y);
  var y = p1.x.minus(p2.x);
  return {x : x.div(d), y : y.div(d), d : d};
}

function dualPath(p) {
  var np = p.length;
  var dp = [];
  var t;
  for (i=0;i<np;i++) {
    t = dualPoint(p[i],p[(i+1)%np]);
    if (! t.d.eq(0) ) {
      delete t.d;
      dp.push(t);
    }
  }
  return dp;
}

function ptToString(p) {
  return "("+p.x.toFixed(2)+","+p.y.toFixed(2)+")";
}

function pathToString(pts) {
  return pts.map(function(p){return ptToString(p)}).join(", ");
}

function isZero(pt) {
  return p.x.eq(0) && p.y.eq(0);
}

