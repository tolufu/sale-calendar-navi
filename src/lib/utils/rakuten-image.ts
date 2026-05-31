/**
 * 楽天公式APIが返す商品画像URLの許可判定を一元化する。
 *
 * 画像ポリシー上、表示してよいのは楽天公式の画像ホストに限られる。
 * 通常経路（APIレスポンス）では検証済みだが、LocalStorage に保存された値が
 * 改ざんされる可能性に備え、保存値の読み込み時と描画時にも同じ関数で再検証する。
 * 許可外のURLは表示せず、外部画像へフォールバックしない。
 */

const ALLOWED_IMAGE_HOST = "image.rakuten.co.jp";

export function isAllowedRakutenImageUrl(value: string | null | undefined): boolean {
  if (!value) {
    return false;
  }

  try {
    const parsed = new URL(value);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false;
    }
    const hostname = parsed.hostname.toLowerCase();
    return hostname === ALLOWED_IMAGE_HOST || hostname.endsWith(`.${ALLOWED_IMAGE_HOST}`);
  } catch {
    return false;
  }
}

/**
 * 許可ホストのURLのみ正規化して返す。許可外・不正な値は null を返す。
 */
export function sanitizeRakutenImageUrl(value: string | null | undefined): string | null {
  if (!isAllowedRakutenImageUrl(value)) {
    return null;
  }

  try {
    return new URL(value as string).toString();
  } catch {
    return null;
  }
}
