import classNames from "classnames";
import Image from "next/image";
import React, { FunctionComponent } from "react";
import { BaseCell } from "..";
import { PoolAssetsIcon, PoolAssetsName } from "../../assets";

export interface PoolCompositionCell extends BaseCell {
  poolId: string;
  poolAssets: {
    coinImageUrl: string | undefined;
    coinDenom: string;
  }[];
}

/** Displays pool composition as a cell in a table.
 *
 *  Accepts the base hover flag.
 */
export const PoolCompositionCell: FunctionComponent<
  Partial<PoolCompositionCell>
> = ({ rowHovered, poolId, poolAssets }) => (
  <div className="flex items-center">
    <PoolAssetsIcon assets={poolAssets} size="sm" />
    <div className="ml-4 mr-1 flex flex-col items-start text-white-full">
      <PoolAssetsName
        size="sm"
        assetDenoms={poolAssets?.map((asset) => asset.coinDenom)}
        className={classNames({
          "text-secondary-200": rowHovered,
        })}
      />
      <span
        className={classNames("text-sm font-caption opacity-60", {
          "text-secondary-600": rowHovered,
        })}
      >
        Pool #{poolId}
      </span>
    </div>
    <Image
      alt="trade"
      src="/icons/trade-green-check.svg"
      height={24}
      width={24}
    />
  </div>
);