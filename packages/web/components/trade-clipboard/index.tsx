import React, { useEffect, useMemo, useRef } from "react";
import Tippy from "@tippyjs/react";
import { TokenSelect } from "../token-select";
import {
  useBooleanWithWindowEvent,
  useSlippageConfig,
  useTradeTokenInConfig,
} from "../../hooks";
import classNames from "classnames";
import { Pool } from "@osmosis-labs/pools";
import { observer } from "mobx-react-lite";
import { useStore } from "../../stores";
import AutosizeInput from "react-input-autosize";
import { Currency } from "@keplr-wallet/types";
import Image from "next/image";
import { InfoTooltip } from "../tooltip";

export const TradeClipboard = observer<
  {
    containerClassName?: string;
    containerStyle?: React.CSSProperties;

    // Should be memorized
    pools: Pool[];
  },
  HTMLDivElement
>(
  ({ containerClassName, containerStyle, pools }, forwardedRef) => {
    const { chainStore, accountStore, queriesStore } = useStore();

    const account = accountStore.getAccount(chainStore.osmosis.chainId);
    const queries = queriesStore.get(chainStore.osmosis.chainId);

    const slippageConfig = useSlippageConfig();

    const tradeTokenInConfig = useTradeTokenInConfig(
      chainStore,
      queriesStore,
      chainStore.osmosis.chainId,
      account.bech32Address,
      undefined,
      pools
    );

    const availableBalance = queries.queryBalances
      .getQueryBech32Address(account.bech32Address)
      .getBalanceFromCurrency(tradeTokenInConfig.sendCurrency);

    const [isSettingOpen, setIsSettingOpen] = useBooleanWithWindowEvent(false);

    const tokenSelectCurrencies = useMemo(() => {
      return tradeTokenInConfig.sendableCurrencies.map((cur) => {
        if ("originChainId" in cur) {
          const originChainId = cur.originChainId;
          if (originChainId && chainStore.hasChain(originChainId)) {
            const chainInfo = chainStore.getChain(originChainId);
            return {
              ...cur,
              meta: [chainInfo.chainName],
            };
          }
          return cur;
        }

        return {
          ...cur,
          meta: [chainStore.osmosis.chainName],
        };
      });
    }, [chainStore, tradeTokenInConfig.sendableCurrencies]);

    const tokenInSelectCurrencies = useMemo(() => {
      return tokenSelectCurrencies.filter(
        (cur) =>
          cur.coinMinimalDenom !==
          tradeTokenInConfig.outCurrency.coinMinimalDenom
      );
    }, [
      tokenSelectCurrencies,
      tradeTokenInConfig.outCurrency.coinMinimalDenom,
    ]);

    const tokenOutSelectCurrencies = useMemo(() => {
      return tokenSelectCurrencies.filter(
        (cur) =>
          cur.coinMinimalDenom !==
          tradeTokenInConfig.sendCurrency.coinMinimalDenom
      );
    }, [
      tokenSelectCurrencies,
      tradeTokenInConfig.sendCurrency.coinMinimalDenom,
    ]);

    const manualSlippageInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
      if (isSettingOpen && slippageConfig.isManualSlippage) {
        // Whenever the setting opened, give a focus to the input if the manual slippage setting mode is on.
        manualSlippageInputRef.current?.focus();
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSettingOpen]);

    return (
      <div
        className={classNames(
          "relative rounded-2xl bg-card border-2 border-cardInner p-2.5",
          containerClassName
        )}
        style={containerStyle}
        ref={forwardedRef}
      >
        <div className="rounded-xl bg-cardInner px-5 pt-5 pb-8">
          <div className="absolute -top-2 inset-x-1/2 -translate-x-1/2 w-[10rem] h-[3.75rem] z-10 bg-gradients-clip rounded-md">
            <div className="absolute bottom-0 rounded-b-md w-full h-5 bg-gradients-clipInner" />
            <div className="absolute inset-x-1/2 -translate-x-1/2 bottom-2 w-12 h-[1.875rem] bg-[rgba(91,83,147,0.12)] rounded-md shadow-[rgba(0,0,0,0.25)_1px_1px_1px_inset]" />
          </div>

          <div className="relative flex justify-end w-full h-11 mb-[1.125rem]">
            <button
              className="relative"
              onClick={(e) => {
                e.stopPropagation();
                setIsSettingOpen(!isSettingOpen);
              }}
            >
              <Image
                width={44}
                height={44}
                src={`/icons/hexagon-border${
                  isSettingOpen ? "-selected" : ""
                }.svg`}
                alt="hexagon border icon"
              />
              <div className="w-5 h-5 absolute inset-1/2 -translate-x-1/2 -translate-y-1/2">
                <Image
                  width={20}
                  height={20}
                  src={`/icons/setting${isSettingOpen ? "-selected" : ""}.svg`}
                  alt="setting icon"
                />
              </div>
            </button>
            {isSettingOpen && (
              <div
                className="absolute bottom-[-0.5rem] right-0 translate-y-full bg-card border border-white-faint rounded-2xl p-[1.875rem] z-20 w-full max-w-[23.875rem]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="subtitle1 text-white-emphasis">
                  Transaction Settings
                </div>
                <div className="flex items-center mt-2.5">
                  <div className="body2 text-white-disabled mr-2">
                    Slippage tolerance
                  </div>
                  <InfoTooltip content="Your transaction will revert if the price changes unfavorably by more than this percentage." />
                  {/* <Tippy
                    content="Your transaction will revert if the price changes unfavorably by more than this percentage."
                    className="bg-wireframes-darkGrey border border-white-faint p-2 rounded-lg text-white-high text-sm"
                  >
                    <div className="flex items-center justify-center bg-enabledGold rounded-full text-[0.625rem] text-color w-3.5 h-3.5 cursor-pointer">
                      !
                    </div>
                  </Tippy> */}
                </div>

                <ul className="flex gap-x-3 w-full mt-3">
                  {slippageConfig.selectableSlippages.map((slippage) => {
                    return (
                      <li
                        key={slippage.index}
                        className={classNames(
                          "flex items-center justify-center w-full h-8 cursor-pointer rounded-full text-white-high",
                          slippage.selected ? "bg-primary-200" : "bg-background"
                        )}
                        onClick={(e) => {
                          e.preventDefault();

                          slippageConfig.select(slippage.index);
                        }}
                      >
                        {slippage.slippage.toString()}
                      </li>
                    );
                  })}
                  <li
                    className={classNames(
                      "flex items-center justify-center w-full h-8 cursor-pointer rounded-full",
                      slippageConfig.isManualSlippage
                        ? "text-white-high"
                        : "text-white-faint",
                      slippageConfig.isManualSlippage
                        ? slippageConfig.getManualSlippageError()
                          ? "bg-missionError"
                          : "bg-primary-200"
                        : "bg-background"
                    )}
                    onClick={(e) => {
                      e.preventDefault();

                      if (manualSlippageInputRef.current) {
                        manualSlippageInputRef.current.focus();
                      }
                    }}
                  >
                    <AutosizeInput
                      inputRef={(ref) => {
                        manualSlippageInputRef.current = ref;
                      }}
                      inputClassName="bg-transparent text-center"
                      minWidth={0}
                      value={slippageConfig.manualSlippageStr}
                      onChange={(e) => {
                        e.preventDefault();

                        slippageConfig.setManualSlippage(e.target.value);
                      }}
                      onFocus={(e) => {
                        e.preventDefault();

                        slippageConfig.setIsManualSlippage(true);
                      }}
                    />
                    <span className="shrink-0">%</span>
                  </li>
                </ul>
              </div>
            )}
          </div>

          <div className="relative">
            <div className="bg-surface rounded-2xl px-4 pt-3 pb-4 relative">
              <div className="flex justify-between items-center">
                <span className="subtitle1 text-white-full">From</span>
                <div className="flex items-center">
                  <span className="caption text-sm text-white-full">
                    Available
                  </span>
                  <span className="caption text-sm text-primary-50 ml-1.5">
                    {availableBalance
                      .trim(true)
                      .shrink(true)
                      .maxDecimals(6)
                      .toString()}
                  </span>
                  <button
                    type="button"
                    className={classNames(
                      "text-white-full text-xs py-1 px-1.5 rounded-md ml-2",
                      tradeTokenInConfig.fraction === 1
                        ? "bg-primary-200"
                        : "bg-white-faint"
                    )}
                    onClick={(e) => {
                      e.preventDefault();

                      if (tradeTokenInConfig.fraction !== 1) {
                        tradeTokenInConfig.setFraction(1);
                      } else {
                        tradeTokenInConfig.setFraction(undefined);
                      }
                    }}
                  >
                    MAX
                  </button>
                  <button
                    type="button"
                    className={classNames(
                      "text-white-full text-xs py-1 px-1.5 rounded-md ml-1",
                      tradeTokenInConfig.fraction === 0.5
                        ? "bg-primary-200"
                        : "bg-white-faint"
                    )}
                    onClick={(e) => {
                      e.preventDefault();

                      if (tradeTokenInConfig.fraction !== 0.5) {
                        tradeTokenInConfig.setFraction(0.5);
                      } else {
                        tradeTokenInConfig.setFraction(undefined);
                      }
                    }}
                  >
                    HALF
                  </button>
                </div>
              </div>
              <div className="flex items-center mt-3">
                <TokenSelect
                  dropdownContainerClassName="pt-[1.25rem] bottom-[0.85rem]"
                  currency={tradeTokenInConfig.sendCurrency}
                  currencies={tokenInSelectCurrencies}
                  onSelect={(currency) => {
                    tradeTokenInConfig.setSendCurrency(currency);
                  }}
                />
                <div className="flex-1" />
                <div className="flex flex-col items-end">
                  <input
                    type="number"
                    className="font-h5 text-h5 text-white-full bg-transparent text-right focus:outline-none w-full"
                    placeholder="0"
                    onChange={(e) => {
                      e.preventDefault();
                      tradeTokenInConfig.setAmount(e.target.value);
                    }}
                    value={tradeTokenInConfig.amount}
                  />
                  <div className="subtitle2 text-white-full">≈ $TODO</div>
                </div>
              </div>
            </div>

            <button
              type="button"
              className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 z-[1]"
              onClick={(e) => {
                e.preventDefault();

                tradeTokenInConfig.switchInAndOut();
              }}
            >
              <Image
                width={48}
                height={48}
                src="/icons/hexagon-border.svg"
                alt="hexagon border icon"
              />
              <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6">
                <Image
                  width={24}
                  height={24}
                  src="/icons/switch.svg"
                  alt="switch icon"
                />
              </div>
            </button>

            <div className="bg-surface rounded-2xl px-4 pt-3 pb-4 mt-[1.125rem] relative">
              <div className="flex justify-between items-center">
                <span className="subtitle1 text-white-full">To</span>
              </div>
              <div className="flex items-center mt-3">
                <TokenSelect
                  dropdownContainerClassName="pt-[1.25rem] bottom-[0.85rem]"
                  currency={tradeTokenInConfig.outCurrency}
                  currencies={tokenOutSelectCurrencies}
                  onSelect={(currency) => {
                    tradeTokenInConfig.setOutCurrency(currency);
                  }}
                />
                <div className="flex-1" />
                <div className="flex flex-col items-end">
                  <h5
                    className={classNames(
                      "text-right",
                      tradeTokenInConfig.expectedSwapResult.amount
                        .toDec()
                        .isPositive()
                        ? "text-white-full"
                        : "text-white-disabled"
                    )}
                  >{`≈ ${tradeTokenInConfig.expectedSwapResult.amount
                    .trim(true)
                    .shrink(true)
                    .maxDecimals(6)
                    .toString()}`}</h5>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-[1.125rem] border border-white-faint rounded-lg bg-card py-3 px-4">
            <div className="flex justify-between">
              <div className="subtitle2 text-wireframes-lightGrey">Rate</div>
              <div className="flex flex-col gap-y-1.5 text-right">
                <div className="subtitle2 text-wireframes-lightGrey">
                  {`1 ${
                    tradeTokenInConfig.sendCurrency.coinDenom
                  } = ${tradeTokenInConfig.expectedSwapResult.beforeSpotPriceWithoutSwapFeeOutOverIn
                    .trim(true)
                    .maxDecimals(3)
                    .toString()} ${tradeTokenInConfig.outCurrency.coinDenom}`}
                </div>
                <div className="caption text-wireframes-grey">
                  {`1 ${
                    tradeTokenInConfig.outCurrency.coinDenom
                  } = ${tradeTokenInConfig.expectedSwapResult.beforeSpotPriceWithoutSwapFeeInOverOut
                    .trim(true)
                    .maxDecimals(3)
                    .toString()} ${tradeTokenInConfig.sendCurrency.coinDenom}`}
                </div>
              </div>
            </div>
            <div className="flex justify-between mt-2.5">
              <div className="subtitle2 text-wireframes-lightGrey">
                Swap Fee
              </div>
              <div className="subtitle2 text-wireframes-lightGrey">
                {tradeTokenInConfig.expectedSwapResult.swapFee.toString()}
              </div>
            </div>
            <div className="flex justify-between pt-4 mt-4 border-t border-white-faint">
              <div className="subtitle2 text-white-high">
                Estimated Slippage
              </div>
              <div className="subtitle2 text-white-high">
                {tradeTokenInConfig.expectedSwapResult.slippage.toString()}
              </div>
            </div>
          </div>

          {/* TODO: Styling warning/error case. Render loading state. Handle rejection. */}
          <button
            className="mt-[1.125rem] flex justify-center items-center w-full h-[3.75rem] rounded-lg bg-primary-200 text-white-full text-base font-medium shadow-md"
            disabled={
              tradeTokenInConfig.error != null &&
              tradeTokenInConfig.optimizedRoutePaths.length > 0
            }
            onClick={async (e) => {
              e.preventDefault();

              if (tradeTokenInConfig.optimizedRoutePaths.length > 0) {
                // TODO: Only multihop is supported yet.
                const routes: {
                  poolId: string;
                  tokenOutCurrency: Currency;
                }[] = [];

                for (
                  let i = 0;
                  i < tradeTokenInConfig.optimizedRoutePaths[0].pools.length;
                  i++
                ) {
                  const pool =
                    tradeTokenInConfig.optimizedRoutePaths[0].pools[i];
                  const tokenOutCurrency =
                    chainStore.osmosisObservable.currencies.find(
                      (cur) =>
                        cur.coinMinimalDenom ===
                        tradeTokenInConfig.optimizedRoutePaths[0]
                          .tokenOutDenoms[i]
                    );

                  if (!tokenOutCurrency) {
                    throw new Error(
                      `Failed to find currency ${tradeTokenInConfig.optimizedRoutePaths[0].tokenOutDenoms[i]}`
                    );
                  }

                  routes.push({
                    poolId: pool.id,
                    tokenOutCurrency,
                  });
                }

                const tokenInCurrency =
                  chainStore.osmosisObservable.currencies.find(
                    (cur) =>
                      cur.coinMinimalDenom ===
                      tradeTokenInConfig.optimizedRoutePaths[0].tokenInDenom
                  );

                if (!tokenInCurrency) {
                  throw new Error(
                    `Failed to find currency ${tradeTokenInConfig.optimizedRoutePaths[0].tokenInDenom}`
                  );
                }

                await account.osmosis.sendMultihopSwapExactAmountInMsg(
                  routes,
                  {
                    currency: tokenInCurrency,
                    amount: tradeTokenInConfig.amount,
                  },
                  slippageConfig.slippage.symbol("").toString()
                );

                // TODO: Notify error if thrown ?
              }
            }}
          >
            Swap
          </button>
        </div>
      </div>
    );
  },
  {
    forwardRef: true,
  }
);