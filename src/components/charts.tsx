import { useMemo, useState } from 'react';
import { StyleSheet, View, type GestureResponderEvent } from 'react-native';
import { FONT, Text } from './Text';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { compact, niceMax, type MonthPoint, type Slice } from '../lib/analytics';
import { number } from '../lib/format';
import { colors, themedStyles } from '../lib/theme';
import { Segmented } from './ui';


/** Blue ramp, darkest = largest. Magnitude is carried by lightness, names/values by the legend. */
export const SLICE_COLORS = ['#1D5FBF', '#2B7DE9', '#4BA3F2', '#7CC0F7', '#A9D8FB'];

function useWidth() {
  const [width, setWidth] = useState(0);
  return { width, onLayout: (e: { nativeEvent: { layout: { width: number } } }) => setWidth(e.nativeEvent.layout.width) };
}

/* ------------------------------------------------------------------ */
/* Spending trend: daily or cumulative, with touch-scrub               */
/* ------------------------------------------------------------------ */

const T_HEIGHT = 200;
const T_PAD = { l: 38, r: 10, t: 12, b: 24 };

/**
 * Daily = one bar per day (spending is discrete amounts, so bars read better than a line).
 * Running = growing area line. Both span the whole month so sparse data still reads as "early in the month".
 */
export function TrendChart({
  daily,
  days,
  currency,
  monthName,
}: {
  /** Spend per day from day 1 up to the last day with data (today for the current month) */
  daily: number[];
  /** Total days in the month; sets the width of the x axis */
  days: number;
  currency: string;
  monthName: string;
}) {
  const { width, onLayout } = useWidth();
  const [mode, setMode] = useState<'daily' | 'cumulative'>('daily');
  const [active, setActive] = useState<number | null>(null);

  const series = useMemo(() => {
    if (mode === 'daily') return daily;
    let run = 0;
    return daily.map((v) => (run += v));
  }, [daily, mode]);

  const total = daily.reduce((n, v) => n + v, 0);
  const n = series.length;
  const max = niceMax(Math.max(...series, 0));
  const plotW = Math.max(width - T_PAD.l - T_PAD.r, 1);
  const plotH = T_HEIGHT - T_PAD.t - T_PAD.b;
  const slot = plotW / days;
  const x = (i: number) => T_PAD.l + slot * (i + 0.5);
  const y = (v: number) => T_PAD.t + plotH - (v / max) * plotH;
  const barW = Math.max(Math.min(slot * 0.62, 12), 3);
  const monthShort = monthName.split(' ')[0].slice(0, 3);

  const line = series.map((v, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = n > 1 ? `${line} L${x(n - 1).toFixed(1)},${y(0)} L${x(0).toFixed(1)},${y(0)} Z` : '';

  const pick = (e: GestureResponderEvent) => {
    if (n === 0) return;
    const i = Math.floor((e.nativeEvent.locationX - T_PAD.l) / slot);
    setActive(Math.min(Math.max(i, 0), n - 1));
  };

  const headline = active === null ? total : series[active];
  const caption =
    active === null
      ? `${monthName} total`
      : `${monthShort} ${active + 1}${mode === 'cumulative' ? ' · running total' : ' · spent'}`;

  return (
    <View>
      <View style={s.headRow}>
        <View style={{ flex: 1 }}>
          <Text style={s.caption}>{caption}</Text>
          <Text style={s.headline} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {currency} {number(headline)}
          </Text>
        </View>
        <View style={{ width: 150 }}>
          <Segmented
            options={[
              { label: 'Daily', value: 'daily' },
              { label: 'Running', value: 'cumulative' },
            ]}
            value={mode}
            onChange={(v) => {
              setMode(v);
              setActive(null);
            }}
          />
        </View>
      </View>

      <View
        onLayout={onLayout}
        style={{ height: T_HEIGHT, marginTop: 8 }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={pick}
        onResponderMove={pick}
        onResponderRelease={() => setActive(null)}
        onResponderTerminate={() => setActive(null)}
      >
        {width > 0 && (
          <Svg width={width} height={T_HEIGHT} pointerEvents="none">
            <Defs>
              <LinearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.sky} stopOpacity={0.35} />
                <Stop offset="1" stopColor={colors.sky} stopOpacity={0} />
              </LinearGradient>
            </Defs>
            {[0, 0.5, 1].map((f) => (
              <G key={f}>
                <Line x1={T_PAD.l} x2={width - T_PAD.r} y1={y(max * f)} y2={y(max * f)} stroke={colors.grid} strokeWidth={1} />
                <SvgText x={T_PAD.l - 8} y={y(max * f) + 4} fontSize={11} fontFamily={FONT.regular} fill={colors.axis} textAnchor="end">
                  {compact(max * f)}
                </SvgText>
              </G>
            ))}
            {Array.from({ length: days }, (_, i) =>
              i % 7 === 0 ? (
                <SvgText key={i} x={x(i)} y={T_HEIGHT - 6} fontSize={11} fontFamily={FONT.regular} fill={colors.axis} textAnchor="middle">
                  {i + 1}
                </SvgText>
              ) : null,
            )}

            {mode === 'daily' &&
              series.map((v, i) =>
                v > 0 ? (
                  <Path
                    key={i}
                    d={topRounded(x(i) - barW / 2, y(v), barW, y(0) - y(v), 3)}
                    fill={colors.skyDeep}
                    opacity={active === null || active === i ? 1 : 0.4}
                  />
                ) : null,
              )}

            {mode === 'cumulative' && n > 1 && <Path d={area} fill="url(#trendFill)" />}
            {mode === 'cumulative' && n > 1 && (
              <Path d={line} stroke={colors.skyDeep} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />
            )}
            {mode === 'cumulative' && n > 0 && active === null && (
              <Circle cx={x(n - 1)} cy={y(series[n - 1])} r={5} fill={colors.skyDeep} stroke={colors.card} strokeWidth={2} />
            )}

            {active !== null && (
              <G>
                <Line x1={x(active)} x2={x(active)} y1={T_PAD.t} y2={y(0)} stroke={colors.skyDeep} strokeOpacity={0.3} strokeWidth={1} />
                {mode === 'cumulative' && (
                  <Circle cx={x(active)} cy={y(series[active])} r={5} fill={colors.skyDeep} stroke={colors.card} strokeWidth={2} />
                )}
              </G>
            )}
          </Svg>
        )}
      </View>
      <Text style={s.hint}>Touch and drag across the chart to read a day.</Text>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Income vs expenses: grouped bars over the last months               */
/* ------------------------------------------------------------------ */

const B_HEIGHT = 170;
const B_PAD = { l: 38, r: 6, t: 10, b: 24 };

function topRounded(x: number, y: number, w: number, h: number, r: number) {
  const rr = Math.min(r, h / 2, w / 2);
  return `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`;
}

export function IncomeExpenseChart({ data, currency }: { data: MonthPoint[]; currency: string }) {
  const { width, onLayout } = useWidth();
  const [picked, setPicked] = useState<number | null>(null);
  const sel = picked ?? data.length - 1;

  const max = niceMax(Math.max(...data.flatMap((d) => [d.income, d.expense]), 0));
  const plotW = Math.max(width - B_PAD.l - B_PAD.r, 1);
  const plotH = B_HEIGHT - B_PAD.t - B_PAD.b;
  const groupW = plotW / data.length;
  const barW = Math.min(14, groupW / 3.2);
  const y = (v: number) => B_PAD.t + plotH - (v / max) * plotH;

  const point = data[sel];

  return (
    <View>
      <View style={s.legendRow}>
        <View style={s.legendItem}>
          <View style={[s.swatch, { backgroundColor: colors.income }]} />
          <Text style={s.legendText}>Income</Text>
        </View>
        <View style={s.legendItem}>
          <View style={[s.swatch, { backgroundColor: colors.expense }]} />
          <Text style={s.legendText}>Expenses</Text>
        </View>
      </View>

      <View style={s.pairRow}>
        <Text style={s.caption}>{point.label}</Text>
        <Text style={[s.pairValue, { color: colors.income }]}>
          {currency} {number(point.income, 0)}
        </Text>
        <Text style={[s.pairValue, { color: colors.expense }]}>
          {currency} {number(point.expense, 0)}
        </Text>
      </View>

      <View
        onLayout={onLayout}
        style={{ height: B_HEIGHT, marginTop: 8 }}
        onStartShouldSetResponder={() => true}
        onResponderRelease={(e) => {
          const i = Math.floor((e.nativeEvent.locationX - B_PAD.l) / groupW);
          if (i >= 0 && i < data.length) setPicked(i);
        }}
      >
        {width > 0 && (
          <Svg width={width} height={B_HEIGHT} pointerEvents="none">
            {[0, 0.5, 1].map((f) => (
              <G key={f}>
                <Line x1={B_PAD.l} x2={width - B_PAD.r} y1={y(max * f)} y2={y(max * f)} stroke={colors.grid} strokeWidth={1} />
                <SvgText x={B_PAD.l - 8} y={y(max * f) + 4} fontSize={11} fontFamily={FONT.regular} fill={colors.axis} textAnchor="end">
                  {compact(max * f)}
                </SvgText>
              </G>
            ))}
            {data.map((d, i) => {
              const cx = B_PAD.l + groupW * i + groupW / 2;
              const dim = i === sel ? 1 : 0.55;
              const ih = y(0) - y(d.income);
              const eh = y(0) - y(d.expense);
              return (
                <G key={d.key}>
                  {i === sel && <Rect x={cx - groupW / 2 + 2} y={B_PAD.t} width={groupW - 4} height={plotH} rx={10} fill={colors.skyTint} opacity={0.7} />}
                  {d.income > 0 && <Path d={topRounded(cx - barW - 1, y(d.income), barW, ih, 4)} fill={colors.income} opacity={dim} />}
                  {d.expense > 0 && <Path d={topRounded(cx + 1, y(d.expense), barW, eh, 4)} fill={colors.expense} opacity={dim} />}
                  <SvgText x={cx} y={B_HEIGHT - 6} fontSize={11} fill={i === sel ? colors.text : colors.axis} fontFamily={i === sel ? FONT.bold : FONT.regular} textAnchor="middle">
                    {d.label}
                  </SvgText>
                </G>
              );
            })}
          </Svg>
        )}
      </View>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Donut: expense by category                                          */
/* ------------------------------------------------------------------ */

const D_SIZE = 168;
const D_STROKE = 24;

export function sliceColor(i: number, name: string) {
  return name === 'Other categories' ? colors.other : SLICE_COLORS[i % SLICE_COLORS.length];
}

export function DonutChart({ slices, currency }: { slices: Slice[]; currency: string }) {
  const total = slices.reduce((n, sl) => n + sl.value, 0);
  const r = (D_SIZE - D_STROKE) / 2;
  const circ = 2 * Math.PI * r;
  const gap = slices.length > 1 ? 3 : 0;
  let offset = 0;

  return (
    <View>
      <View style={s.donutWrap}>
        <Svg width={D_SIZE} height={D_SIZE}>
          <Circle cx={D_SIZE / 2} cy={D_SIZE / 2} r={r} stroke={colors.skyTint} strokeWidth={D_STROKE} fill="none" />
          <G transform={`rotate(-90 ${D_SIZE / 2} ${D_SIZE / 2})`}>
            {slices.map((sl, i) => {
              const len = (sl.value / total) * circ;
              const dash = Math.max(len - gap, 0.5);
              const el = (
                <Circle
                  key={sl.name}
                  cx={D_SIZE / 2}
                  cy={D_SIZE / 2}
                  r={r}
                  stroke={sliceColor(i, sl.name)}
                  strokeWidth={D_STROKE}
                  strokeDasharray={`${dash} ${circ - dash}`}
                  strokeDashoffset={-offset}
                  fill="none"
                />
              );
              offset += len;
              return el;
            })}
          </G>
        </Svg>
        <View style={s.donutCenter} pointerEvents="none">
          <Text style={s.caption}>Spent</Text>
          <Text style={s.donutTotal} numberOfLines={1} adjustsFontSizeToFit>
            {number(total, 0)}
          </Text>
          <Text style={s.caption}>{currency}</Text>
        </View>
      </View>

      <View style={{ marginTop: 16 }}>
        {slices.map((sl, i) => (
          <View key={sl.name} style={s.legendLine}>
            <View style={[s.swatch, { backgroundColor: sliceColor(i, sl.name) }]} />
            <Text style={s.legendName} numberOfLines={1}>
              {sl.name}
            </Text>
            <Text style={s.legendPct}>{Math.round((sl.value / total) * 100)}%</Text>
            <Text style={s.legendAmount}>
              {currency} {number(sl.value, 0)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const s = themedStyles(() => StyleSheet.create({
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  caption: { fontSize: 12.5, color: colors.muted },
  headline: { fontSize: 20, fontWeight: '800', color: colors.text, marginTop: 2 },
  hint: { fontSize: 12, color: colors.axis, textAlign: 'center', marginTop: 6 },
  legendRow: { flexDirection: 'row', gap: 16, marginBottom: 10 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontSize: 13, color: colors.muted, fontWeight: '500' },
  pairRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  pairValue: { fontSize: 15, fontWeight: '800' },
  donutWrap: { alignSelf: 'center', width: D_SIZE, height: D_SIZE, alignItems: 'center', justifyContent: 'center' },
  donutCenter: { position: 'absolute', alignItems: 'center', width: D_SIZE - D_STROKE * 2 - 12 },
  donutTotal: { fontSize: 26, fontWeight: '800', color: colors.text },
  legendLine: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  legendName: { flex: 1, fontSize: 14.5, fontWeight: '600', color: colors.text },
  legendPct: { fontSize: 13, color: colors.muted, width: 40, textAlign: 'right' },
  legendAmount: { fontSize: 14.5, fontWeight: '700', color: colors.text, minWidth: 92, textAlign: 'right' },
}));
