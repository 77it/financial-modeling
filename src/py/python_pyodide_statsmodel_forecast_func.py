# TODO: to be improved, this is a minimal example

import pandas as pd
from statsmodels.tsa.exponential_smoothing.ets import ETSModel
import numpy as np

mean = None
pi_lower = None
pi_upper = None

def forecast_data(months, values):
    global dates, mean, pi_lower, pi_upper

    data = {
        "Month": months,
        "Values": values
        }

    # Create a DataFrame
    df_data = pd.DataFrame(data)
    # df = pd.concat([df, df])  # Duplicate the data, to fit 24 months
    # Convert the 'Month' column to a datetime format
    df_data.set_index('Month', inplace=True)
    df_data.index = pd.date_range(start='1/1/2020', periods=len(df_data), freq='M')

    # Interpolate missing data (if any)
    df_data['Values'] = df_data['Values'].interpolate()

    #
    # new AAA model (ETSModel) with confidence
    #
    # The ETSModel returns data similar, but not exactly equal, to Excel FORECAST.ETS function
    #

    # Fit the AAA model
    # Build model
    ets_model = ETSModel(
        endog=df_data['Values'],
        error='add',
        trend='add',
        seasonal='add',
        seasonal_periods=12,
    )
    ets_result = ets_model.fit(disp=False)  # Set disp=False to disable optimization messages

    #
    # Get prediction with `get_prediction`
    #
    # see https://www.statsmodels.org/devel/generated/statsmodels.tsa.exponential_smoothing.ets.ETSResults.get_prediction.html
    # source code https://www.statsmodels.org/devel/_modules/statsmodels/tsa/exponential_smoothing/ets.html#ETSResults.get_prediction
    pred = ets_result.get_prediction(start = 24, end = 24+11)
    #pred = ets_result.get_prediction(start =  df_simul.index[0], end = df_simul.index[-1])  # works also with dates
    print("\nnForecast for the next 12 months + 95% Confidence Intervals with `ETSModel` & `get_prediction` & `summary_frame`:")
    df_pred = pred.summary_frame(alpha=0.05)
    print(df_pred)

    # export values to global
    dates = df_pred.index.strftime('%Y-%m-%d').tolist()  # convert DatetimeIndex to an array of strings
    mean = df_pred['mean'].values
    pi_lower = df_pred['pi_lower'].values
    pi_upper = df_pred['pi_upper'].values
