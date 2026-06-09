/**
 * 楽天公式APIが返す商品画像URLの許可判定を一元化する。
 *
 * 画像ポリシー上、表示してよいのは楽天公式の画像ホストに限られる。
 * 通常経路（APIレスポンス）では検証済みだが、LocalStorage に保存された値が
 * 改ざんされる可能性に備え、保存値の読み込み時と描画時にも同じ関数で再検証する。
 * 許可外のURLは表示せず、外部画像へフォールバックしない。
 */

import { isAllowedProductImageUrl, sanitizeProductImageUrl } from "@/lib/utils/product-image";

export function isAllowedRakutenImageUrl(value: string | null | undefined): boolean {
  return isAllowedProductImageUrl("rakuten_api", value);
}

/**
 * 許可ホストのURLのみ正規化して返す。許可外・不正な値は null を返す。
 */
export function sanitizeRakutenImageUrl(value: string | null | undefined): string | null {
  return sanitizeProductImageUrl("rakuten_api", value);
}
