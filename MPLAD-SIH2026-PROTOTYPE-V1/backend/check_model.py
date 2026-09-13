import joblib
import sklearn
import sys
try:
    pipe = joblib.load('models/isolation_forest_pipeline.pkl')
    print('Sklearn version used in model:', getattr(pipe, '_sklearn_version', 'Unknown'))
    print('Current sklearn in env:', sklearn.__version__)
except Exception as e:
    print('Error loading model:', e)
